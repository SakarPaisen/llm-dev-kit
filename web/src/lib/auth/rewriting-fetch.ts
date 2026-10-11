/**
 * A fetch that sends requests for `from/...` to `to/...` instead.
 *
 * For an OIDC issuer whose public URL does not resolve from this server, as
 * inside Docker: the browser and the tokens keep the public URL, while
 * discovery, token and key requests go over the internal network.
 */
export function rewritingFetch(from: string, to: string): typeof fetch {
  return (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    if (!url.startsWith(`${from}/`) && url !== from) return fetch(input, init)
    const target = `${to}${url.slice(from.length)}`
    return input instanceof Request ? fetch(new Request(target, input), init) : fetch(target, init)
  }
}
