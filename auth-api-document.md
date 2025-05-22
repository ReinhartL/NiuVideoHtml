# 用户认证API文档

这是一个基于next.js的后端项目，我的数据库连接方式是：mongodb://root:m66ll5ww@test-db-mongodb.ns-54ewi9xh.svc:27017

## 基础信息
- 基础URL: `http://emyeornofdcg.sealoshzh.site`
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
  "error": {
    "code": "错误码",
    "message": "错误信息"
  }
}
```

## 1. 用户注册接口

### 1.1 普通用户注册
- **路径**: `/api/auth/register`
- **方法**: POST
- **请求体**:
```json
{
  "username": "string",  // 用户名，4-20个字符，只能包含字母、数字和下划线
  "password": "string",  // 密码，6-20个字符，必须包含字母和数字
  "confirmPassword": "string"  // 确认密码，必须与password相同
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
      "createdAt": "string",  // ISO 8601格式
      "balance": 0
    },
    "token": "string"  // JWT token
  }
}
```
- **错误响应**:
  - 400: 请求参数错误
    ```json
    {
      "success": false,
      "error": {
        "code": "INVALID_PARAMS",
        "message": "用户名或密码格式不正确"
      }
    }
    ```
  - 409: 用户名已存在
    ```json
    {
      "success": false,
      "error": {
        "code": "USER_EXISTS",
        "message": "用户名已被注册"
      }
    }
    ```
  - 500: 服务器错误

### 1.2 临时用户注册
- **路径**: `/api/auth/register/temp`
- **方法**: POST
- **请求体**:
```json
{
  "episodeId": "string",  // 要观看的剧集ID
  "price": number  // 剧集价格
}
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "tempUser": {
      "id": "string",
      "username": "string",  // 自动生成的临时用户名
      "expireTime": "string",  // ISO 8601格式，24小时后过期
      "episodeId": "string"  // 可观看的剧集ID
    },
    "token": "string"  // JWT token
  }
}
```
- **错误响应**:
  - 400: 请求参数错误
  - 404: 剧集不存在
  - 500: 服务器错误

## 2. 用户登录接口

### 2.1 普通用户登录
- **路径**: `/api/auth/login`
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
      "level": "string",  // 用户等级：NORMAL/VIP/VVVIP
      "lastLoginTime": "string"  // ISO 8601格式
    },
    "token": "string"  // JWT token
  }
}
```
- **错误响应**:
  - 400: 请求参数错误
  - 401: 用户名或密码错误
  - 500: 服务器错误

### 2.2 临时用户登录
- **路径**: `/api/auth/login/temp`
- **方法**: POST
- **请求体**:
```json
{
  "username": "string",  // 临时用户名
  "token": "string"  // 临时用户token
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
      "expireTime": "string",  // ISO 8601格式
      "episodeId": "string"  // 可观看的剧集ID
    },
    "token": "string"  // JWT token
  }
}
```
- **错误响应**:
  - 400: 请求参数错误
  - 401: 认证失败
  - 403: 临时用户已过期
  - 500: 服务器错误

## 3. 用户信息接口

### 3.1 获取用户信息
- **路径**: `/api/auth/user`
- **方法**: GET
- **需要认证**: 是
- **请求头**:
```
Authorization: Bearer <token>
```
- **成功响应** (200):
```json
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "balance": number,
    "level": "string",
    "createdAt": "string",
    "lastLoginTime": "string"
  }
}
```
- **错误响应**:
  - 401: 未认证或token无效
  - 500: 服务器错误

## 4. 错误码说明

- 200: 请求成功
- 400: 请求参数错误
- 401: 未认证或认证失败
- 403: 权限不足
- 404: 资源不存在
- 409: 资源冲突
- 500: 服务器内部错误

## 5. 注意事项

1. 所有需要认证的接口都需要在请求头中携带token
2. 密码在传输过程中需要进行加密处理
3. JWT token的有效期为24小时
4. 临时用户的有效期为24小时
5. 所有接口都有请求频率限制，请合理控制请求频率
6. 建议在正式环境使用HTTPS 