import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // 模拟视频数据库
  const videoDatabase: Record<string, any> = {
    '12': {
      id: '12',
      title: '示例视频系列',
      displayName: '尊老爱幼',
      cover: 'https://example.com/cover.jpg',
      freeEpisodes: 2,
      totalEpisodes: 5,
    },
    '13': {
      id: '13',
      title: '短视频合集',
      displayName: '精彩短片',
      cover: 'https://example.com/cover2.jpg',
      freeEpisodes: 3,
      totalEpisodes: 8,
    },
  };

  const videoData = videoDatabase[id as string];

  if (videoData) {
    res.status(200).json({
      success: true,
      data: videoData,
    });
  } else {
    res.status(404).json({
      success: false,
      error: '视频未找到',
    });
  }
} 