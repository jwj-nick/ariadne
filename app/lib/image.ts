/**
 * 위키미디어에 걸어 둔 그림의 주소를 만든다 (D29).
 *
 * 파일 이름만으로 부를 수 있는 주소라 해시 경로를 몰라도 되고, 저쪽에서 파일을 옮겨도 따라간다.
 * 폭을 지정하면 저쪽이 그 크기로 줄여 보내 주므로, 목록의 작은 칸에 원본을 받아 올 일이 없다.
 */

/** 카드 본문에 크게 싣는 그림. */
export function imageUrl(file: string, width = 900): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

/** 목록의 격자에 까는 작은 그림. 한 칸이 백 픽셀 남짓이라 이백이면 넉넉하다. */
export function thumbUrl(file: string, width = 200): string {
  return imageUrl(file, width);
}

/** 그 그림의 출처 쪽. 저작권과 만든 사람이 거기 적혀 있다. */
export function sourcePage(file: string): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;
}
