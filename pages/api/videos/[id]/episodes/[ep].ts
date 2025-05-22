import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, ep } = req.query; // 获取 id 和 ep 参数
  // 从数据库中获取视频数据
  const videoData = getVideoDataFromDatabase(id as string, ep as string);
  if (videoData) {
    res.status(200).json(videoData);
  } else {
    res.status(404).json({ error: '视频未找到' });
  }
}

function getVideoDataFromDatabase(id: string, ep: string) {
  // 模拟数据库查询
  const database: Record<string, Record<string, { title: string; url: string}>> = {
    '12': {
      '1': { title: '示例视频', url: 'https://objectstorageapi.hzh.sealos.run/epwxmcft-videobucket01.com/%E5%B0%8A%E8%80%81%E7%88%B1%E5%B9%BC-tx/001.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=epwxmcft%2F20250413%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250413T051614Z&X-Amz-Expires=900&X-Amz-Signature=e0c8df50e92d134c9b950bcb9981d764155abe3d1ff27de570fba96685d50d05&X-Amz-SignedHeaders=host&x-id=GetObject' },
      '2': { title: '示例视频 2', url: '/assets/movie/2.mp4' },
      // 其他集数据
    },
    // 其他视频数据
  };
  return database[id]?.[ep];
}
