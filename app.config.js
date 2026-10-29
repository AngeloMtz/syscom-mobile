// app.config.js — Configuración dinámica (reemplaza a app.json).
// Necesario para que android.googleServicesFile pueda leer la variable de
// entorno GOOGLE_SERVICES_JSON en los builds de EAS: el archivo está en
// .gitignore (repo público), así que EAS no lo sube con el proyecto y hay que
// dárselo como variable de entorno de tipo archivo (ver `eas env:set`).
// En tu máquina local, sin esa variable, sigue usando el archivo físico.
module.exports = {
  expo: {
    name: "syscom-mobile",
    slug: "syscom-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "syscommobile",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
    },
    android: {
      package: "com.syscom.mobile",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      bundler: "metro",
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-font",
      "expo-web-browser",
      [
        "expo-notifications",
        {
          icon: "./assets/android-icon-monochrome.png",
          color: "#05afe8",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "d59c39b8-b07c-4b4d-9fe4-e79def2ecb6c",
      },
    },
    owner: "imangeloos-team",
  },
};
