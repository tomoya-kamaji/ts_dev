import * as kuromoji from "kuromoji";

const tokenizer = kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" });

type TextWithFurigana = {
  original: string;
  furigana: string;
};

type TextWithFuriganaList = TextWithFurigana[];

/**
 * inputからふりがなに変換
 */
export const addFurigana = async (
  text: string
): Promise<TextWithFuriganaList> => {
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
  const textWithFuriganaList = tokens.map((token) => {
    // 漢字のときはふりがなを付ける
    return {
      original: token.surface_form,
      furigana: token.reading || "",
    };
  });
  return textWithFuriganaList;
};
