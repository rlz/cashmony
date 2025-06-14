import { mkdir } from 'fs/promises'
import { DateTime } from 'luxon'
import { NodeSSH } from 'node-ssh'

const SSH = new NodeSSH()

console.log('Connecting...')
await SSH.connect({
    host: '93.183.81.2',
    username: 'root',
    privateKeyPath: '/Users/rlz/.ssh/id_rsa'
})

console.log('Dump data...')
await SSH.exec('rm', ['-rf', '/cashmony/dump'])
await SSH.exec('mongodump', ['--gzip', '-d', 'cashmony-app'], { cwd: '/cashmony', stream: 'stderr' })

console.log('Download data...')
const DIR_NAME = `./backups/${DateTime.utc().toFormat('yyyyMMdd\'T\'HHmmss\'Z\'')}`
await mkdir(DIR_NAME, { recursive: true })
await SSH.getDirectory(DIR_NAME, '/cashmony/dump')
SSH.dispose()

console.log('Done!')
