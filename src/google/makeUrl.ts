export default function makeUrl(base: string, params: Record<string, string>): string {
    return base + '?' + Object
        .entries(params)
        .map(([param, value]) => `${param}=${encodeURIComponent(value)}`)
        .join('&')
}
