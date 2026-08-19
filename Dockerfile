# Multi-stage Dockerfile for KIOT-CDT (ASP.NET Core + React Vite)

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build .NET Backend
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-builder
WORKDIR /src
COPY backend/backend.csproj ./backend/
RUN dotnet restore ./backend/backend.csproj
COPY backend/ ./backend/
COPY --from=frontend-builder /app/dist ./backend/wwwroot
RUN dotnet publish ./backend/backend.csproj -c Release -o /app/publish

# Stage 3: Runtime Environment
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
ENV PORT=8080
EXPOSE 8080
COPY --from=backend-builder /app/publish .
ENTRYPOINT ["dotnet", "backend.dll"]
