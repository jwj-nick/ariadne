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

/**
 * 잘라 낼 때 어디를 남길지 정한다 (D40).
 *
 * 격자 칸은 정사각형인데 조각상과 초상화는 세로로 길다. 가운데를 기준으로 자르면
 * 머리가 잘려 나가 누구인지 알아볼 수 없게 된다. 볼보 카드의 아레스 상이 그랬다.
 * 세로로 긴 그림만 위쪽을 남기고, 가로로 긴 그림과 정사각형에 가까운 것은 그대로 둔다.
 *
 * 그림을 받아 보기 전에는 비율을 알 수 없으므로 onLoad 에서 부른다.
 */
export function framing(img: { naturalWidth: number; naturalHeight: number }): string {
  if (img.naturalWidth === 0) return 'center';
  return img.naturalHeight > img.naturalWidth * 1.15 ? 'center 18%' : 'center';
}
