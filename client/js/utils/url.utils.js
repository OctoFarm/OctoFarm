export function replaceHttpProtocolWith(url, protocolWithColon) {
  const urlInstance = new URL(url);
  urlInstance.protocol = protocolWithColon;
  return urlInstance.href;
}
