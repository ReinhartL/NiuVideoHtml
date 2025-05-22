# 视频播放系统API文档

## 基础信息
- 基础URL: `http://emyeornofdcg.sealoshzh.site`
- 所有需要认证的接口都需要在请求头中携带token：
  ```
  Authorization: Bearer <your_token>
  ```
- 所有请求和响应均使用JSON格式
- 时间格式统一使用ISO 8601标准

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    // 具体数据
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 1. 用户认证接口

### 1.1 用户登录
- **路径**: `pages/api/auth/signin`
- **方法**: POST
- **请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "balance": number,
      "level": "string"
    },
    "token": "string"
  }
}
```
- **失败响应**:
  - 400: 请求参数错误
  - 401: 用户名或密码错误
  - 500: 服务器错误

### 1.2 用户注册
- **路径**: `pages/api/auth/signup`
- **方法**: POST
- **请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string"
    },
    "token": "string"
  }
}
```
- **失败响应**:
  - 400: 请求参数错误
  - 409: 用户名已存在
  - 500: 服务器错误

### 1.3 临时用户注册
- **路径**: `pages/api/register/temp`
- **方法**: POST
- **请求体**:
```json
{
  "episodeId": "string",
  "price": number
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "tempUser": {
      "id": "string",
      "username": "string",
      "expireTime": "string"
    },
    "token": "string"
  }
}
```
- **失败响应**:
  - 400: 请求参数错误
  - 500: 服务器错误

## 2. 视频相关接口

### 2.1 获取视频信息
- **路径**: `pages/api/videos/[id]`
- **方法**: GET
- **需要认证**: 是
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "cover": "string",
    "description": "string"
  }
}
```
- **失败响应**:
  - 401: 未认证
  - 404: 视频不存在
  - 500: 服务器错误

### 2.2 获取视频价格信息
- **路径**: `pages/api/videos/[id]/pricing`
- **方法**: GET
- **需要认证**: 是
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "singleEpisodePrice": number,
    "memberSinglePrice": number,
    "memberAllEpisodesPrice": number,
    "vvvipPrice": "string"
  }
}
```
- **失败响应**:
  - 401: 未认证
  - 404: 视频不存在
  - 500: 服务器错误

### 2.3 获取用户可访问的剧集
- **路径**: `pages/api/videos/[id]/user-episodes`
- **方法**: GET
- **需要认证**: 是
- **成功响应** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "isLocked": boolean
    }
  ]
}
```
- **失败响应**:
  - 401: 未认证
  - 404: 视频不存在
  - 500: 服务器错误

## 3. 支付相关接口

### 3.1 扫码支付
- **路径**: `pages/api/payment/scan`
- **方法**: POST
- **需要认证**: 是
- **请求体**:
```json
{
  "userId": "string",
  "episodeId": "string",
  "price": number
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "paymentUrl": "string",
    "orderId": "string"
  }
}
```
- **失败响应**:
  - 400: 请求参数错误
  - 401: 未认证
  - 404: 用户不存在
  - 500: 服务器错误

### 3.2 余额支付（单集）
- **路径**: `pages/api/payment/balance`
- **方法**: POST
- **需要认证**: 是
- **请求体**:
```json
{
  "userId": "string",
  "episodeId": "string",
  "price": number
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "message": "支付成功"
  }
}
```
- **失败响应**:
  - 400: 请求参数错误/余额不足
  - 401: 未认证
  - 404: 用户不存在
  - 500: 服务器错误

### 3.3 余额支付（全集）
- **路径**: `pages/api/payment/balance/all`
- **方法**: POST
- **需要认证**: 是
- **请求体**:
```json
{
  "userId": "string",
  "videoId": "string",
  "price": number
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "message": "支付成功"
  }
}
```
- **失败响应**:
  - 400: 请求参数错误/余额不足
  - 401: 未认证
  - 404: 用户不存在
  - 500: 服务器错误

### 3.4 VVVIP支付
- **路径**: `pages/api/payment/vvvip`
- **方法**: POST
- **需要认证**: 是
- **请求体**:
```json
{
  "userId": "string",
  "price": number
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "message": "VVVIP开通成功",
    "expireTime": "string"
  }
}
```
- **失败响应**:
  - 400: 请求参数错误/余额不足
  - 401: 未认证
  - 404: 用户不存在
  - 500: 服务器错误

### 3.5 撤销VVVIP权限
- **路径**: `pages/api/payment/revoke-vvvip`
- **方法**: POST
- **需要认证**: 是
- **请求体**:
```json
{
  "userId": "string"
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "message": "VVVIP权限已撤销"
  }
}
```
- **失败响应**:
  - 400: 请求参数错误/用户不是VVVIP
  - 401: 未认证
  - 404: 用户不存在
  - 500: 服务器错误

## 4. 错误码说明

- 200: 请求成功
- 400: 请求参数错误
- 401: 未认证或认证失败
- 404: 资源不存在
- 409: 资源冲突
- 500: 服务器内部错误

## 5. 注意事项

1. 所有需要认证的接口都需要在请求头中携带token
2. 涉及金额的接口都需要进行事务处理，确保数据一致性
3. 所有接口都有请求频率限制，请合理控制请求频率
4. 支付相关接口建议在正式环境使用HTTPS
5. 临时用户的有效期为24小时
6. VVVIP会员的有效期为30天 