import { type ReportCallback } from 'web-vitals'

const reportWebVitals = async (onPerfEntry?: ReportCallback): Promise<void> => {
    if ((onPerfEntry != null) && onPerfEntry instanceof Function) {
        const webVitals = await import('web-vitals')

        webVitals.getCLS(onPerfEntry)
        webVitals.getFID(onPerfEntry)
        webVitals.getFCP(onPerfEntry)
        webVitals.getLCP(onPerfEntry)
        webVitals.getTTFB(onPerfEntry)
    }
}

export default reportWebVitals
