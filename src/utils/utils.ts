// 윈도우 File Path 변경
export const changePathFormula = (urlPath: string): string => {
  return urlPath.replace(/\\/g, "/");
};