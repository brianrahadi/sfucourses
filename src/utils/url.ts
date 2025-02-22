export function insertUrlParam(key: string, value: string): void {
  if (window.history.pushState) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set(key, value);
    const newUrl =
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname +
      "?" +
      searchParams.toString();
    window.history.pushState({ path: newUrl }, "", newUrl);
  }
}

export function removeUrlParameter(paramKey: string) {
  const url = window.location.href;
  const urlObject = new URL(url);
  urlObject.searchParams.delete(paramKey);
  const newUrl = urlObject.href;
  window.history.pushState({ path: newUrl }, "", newUrl);
}

export function addParameterToUrl(
  url: string,
  paramName: string,
  paramValue: string
): string {
  const urlObj = new URL(url);
  urlObj.searchParams.set(paramName, paramValue);
  return urlObj.toString();
}
