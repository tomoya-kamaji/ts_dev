// ジョブキューを作成
const jobQueue: string[] = [];

// id を受け取り、ジョブキューに追加する関数
export const produce = (ids: string[]) => {
  ids.forEach((id) => {
    jobQueue.push(id);
  });
};

// ジョブキューからジョブを取り出し、処理する関数
export const consume = async (): Promise<void> => {
  while (jobQueue.length > 0) {
    const id = jobQueue.shift();
    if (!id) return;
    try {
      const data = await fetchArticleData(id);

      // 実際はここでデータを使った処理を行う。加工してデータベースに保存する
      console.log(`Data for ${id}:`, data);
    } catch (error) {
      console.error(`Error processing ${id}:`, error);
    }
  }
};

// 記事データの型定義
interface ArticleData {
  id: number;
  title: string;
  content: string;
}

// データベースから記事情報を取得する関数
export const fetchArticleData = async (
  articleId: string
): Promise<ArticleData> => {
  try {
    // 模擬的な "データベース" からのデータ応答
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1秒のディレイを模擬
    // デモ用のランダムなデータを生成
    const articleData: ArticleData = {
      id: Math.floor(Math.random() * 1000),
      title: `Article Title ${articleId}`,
      content: `Content for article ${articleId}...`,
    };

    return articleData;
  } catch (error) {
    console.error(`Error fetching data for article ${articleId}:`, error);
    throw error;
  }
};
