# Docker 部署说明

## 环境要求
- Docker
- Docker Compose

## 快速开始

1. 克隆项目
2. 创建环境变量文件：
  ```
  cp .env.example .env.docker
  ```

  
3. 编辑 .env.docker，设置正确的密码和 API Key
4. 启动服务：
  ```
  docker compose up -d --build
  ```

   5.清除数据：

​	`docker compose down -v`

## 服务访问
- 前端：http://localhost:5173
- 后端API：http://localhost:3000
- 数据库：localhost:3307 (用户/密码在 .env.docker 中)

