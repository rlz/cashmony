export function compareByStats (stats: ReadonlyMap<string, number>): (s1: string, s2: string) => number {
    return (s1: string, s2: string) => {
        const s1Stats = stats.get(s1) ?? 0
        const s2Stats = stats.get(s2) ?? 0

        if (s1Stats === s2Stats) {
            return s1.localeCompare(s2)
        }

        return s1Stats < s2Stats ? 1 : -1
    }
}
