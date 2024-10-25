import * as kuromoji from "kuromoji";

const tokenizer = kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" });

export const addFurigana = async (text: string): Promise<string> => {
  const tokenizerInstance = await new Promise<
    kuromoji.Tokenizer<kuromoji.IpadicFeatures>
  >((resolve, reject) => {
    tokenizer.build((err, tokenizer) => {
      if (err) {
        return reject(err);
      }
      resolve(tokenizer);
    });
  });

  const tokens = tokenizerInstance.tokenize(text);
  const furiganaText = tokens
    .map((token) => {
      // 表層形と読みが異なる場合にふりがなを付ける
      if (token.surface_form !== token.reading) {
        return `${token.surface_form}(${token.reading})`;
      }
      return token.surface_form;
    })
    .join("");

  return furiganaText;
};
