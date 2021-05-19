interface Error {
  reason: string
}

interface CrawlData<A> {
  value :A
}

type Crawler<L extends Error, R> = (url: string) => [L, R]
type Parser<L extends Error, R> = (response : R) => [] | [L, R]
