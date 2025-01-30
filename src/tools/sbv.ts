export function sbvToJson(rawText: string) {
    const rawArr = rawText.replace(/\r\n/g, "\n").split('\n');
    console.log(rawArr);
  const chunks: string[][] = [];

  rawArr.forEach((str) => {
      if (str === '') {
          chunks.push([]);
      } else {
          let lastItem = chunks[chunks.length - 1];
          if (!lastItem) {
              lastItem = [];
              chunks.push(lastItem);
          }
          lastItem.push(str);
      }
  });

  const json = chunks.filter(chunk => chunk?.length > 1).reduce<{
    [key: string]: string;
  }>((result, chunk) => {
      const [timeline, ...lines] = chunk;
      result[timeline] = lines.join('\n');
      return result;
  }, {});

  return json;
}

export function jsonToSbv(json: { [key: string]: string }) {
  return Object.entries(json).reduce((result, current, index, self) => {
      const [timeline, text] = current;
      result += timeline;
      result += '\n';
      result += text;
      if (index < self.length - 1) {
          result += '\n\n';
      }
      return result;
  }, '');
}