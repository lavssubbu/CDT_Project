# Multi-stage Dockerfile for KIOT-CDT (ASP.NET Core + React Vite)

# Stage 1: Build .NET Backend with Verified Frontend Bundle
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-builder
WORKDIR /src
COPY backend/backend.csproj ./backend/
RUN dotnet restore ./backend/backend.csproj
COPY backend/ ./backend/
RUN rm -rf ./backend/wwwroot/* || true
COPY dist/ ./backend/wwwroot/
RUN dotnet publish ./backend/backend.csproj -c Release -o /app/publish
RUN cp ./backend/seed_data.json /app/publish/seed_data.json || true

# Stage 2: Runtime Environment
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
ENV PORT=8080
EXPOSE 8080
COPY --from=backend-builder /app/publish .
ENTRYPOINT ["dotnet", "backend.dll"]
