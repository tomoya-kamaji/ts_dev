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
    // TODO: 漢字のときはふりがなを付ける
    const original = token.surface_form;
    const reading = token.reading || "";
    const furigana = isKanji(original) ? reading : "";
    return {
      original,
      furigana,
    };
  });
  return textWithFuriganaList;
};

// 漢字のみで構成されているかを判定する関数
const isKanji = (str: string): boolean => {
  return /^[\u4E00-\u9FFF]+$/.test(str);
};
