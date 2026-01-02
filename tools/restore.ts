import { boolean, command, flag, positional, run, string } from 'cmd-ts'
import { Directory } from 'cmd-ts/dist/cjs/batteries/fs.js'
import { NodeSSH } from 'node-ssh'

const APP = command({
    name: 'restore',
    description: 'Restore backup',
    args: {
        backupDataDir: positional({
            type: Directory,
            displayName: 'backup-dir',
            description: 'Directory with backup data'
        }),
        server: positional({
            type: string,
            displayName: 'server',
            description: 'A server with MongoDB installed'
        }),
        drop: flag({
            type: boolean,
            long: 'drop',
            short: 'd',
            description: 'drop each collection before import'
        })
    },
    handler: async ({ backupDataDir, server, drop }) => {
        const ssh = new NodeSSH()

        console.log('Connecting...')
        await ssh.connect({
            host: server,
            username: 'root',
            privateKeyPath: '/Users/rlz/.ssh/id_rsa'
        })

        await ssh.exec('rm', ['-rf', '/backup-data'])
        await ssh.exec('mkdir', ['/backup-data'])

        console.log('Upload data...')
        await ssh.putDirectory(backupDataDir, '/backup-data')

        console.log('Restore data...')
        const args = ['--gzip']
        if (drop) {
            args.push('--drop')
        }
        args.push('/backup-data')
        await ssh.exec('mongorestore', args, { stream: 'stderr' })

        ssh.dispose()
    }
})

await run(APP, process.argv.slice(2))
