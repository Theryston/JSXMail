export const htmlSecurityList: { [key: string]: string[] } = {
  a: ['class', 'href', 'id', 'style', 'target'],
  b: ['class', 'id', 'style'],
  br: ['class', 'id', 'style'],
  div: ['align', 'class', 'dir', 'id', 'style'],
  font: ['class', 'color', 'face', 'id', 'size', 'style'],
  h1: ['align', 'class', 'dir', 'id', 'style'],
  h2: ['align', 'class', 'dir', 'id', 'style'],
  h3: ['align', 'class', 'dir', 'id', 'style'],
  h4: ['align', 'class', 'dir', 'id', 'style'],
  h5: ['align', 'class', 'dir', 'id', 'style'],
  h6: ['align', 'class', 'dir', 'id', 'style'],
  hr: ['align', 'size', 'width'],
  img: [
    'align',
    'border',
    'class',
    'height',
    'hspace',
    'id',
    'src',
    'style',
    'usemap',
    'vspace',
    'width',
    'alt',
    'path',
  ],
  label: ['class', 'id', 'style'],
  li: ['class', 'dir', 'id', 'style', 'type'],
  ol: ['class', 'dir', 'id', 'style', 'type'],
  p: ['class', 'dir', 'id', 'style', 'type'],
  span: ['class', 'id', 'style'],
  table: [
    'align',
    'bgcolor',
    'border',
    'cellpadding',
    'cellspacing',
    'class',
    'dir',
    'frame',
    'id',
    'rules',
    'style',
    'width',
  ],
  td: [
    'abbr',
    'align',
    'bgcolor',
    'class',
    'colspan',
    'dir',
    'height',
    'id',
    'lang',
    'rowspan',
    'scope',
    'style',
    'valign',
    'width',
  ],
  th: [
    'abbr',
    'align',
    'background',
    'bgcolor',
    'class',
    'colspan',
    'dir',
    'height',
    'id',
    'lang',
    'scope',
    'style',
    'valign',
    'width',
  ],
  tr: ['align', 'bgcolor', 'class', 'dir', 'id', 'style', 'valign'],
  u: ['class', 'id', 'style'],
  ul: ['class', 'dir', 'id', 'style'],
};
