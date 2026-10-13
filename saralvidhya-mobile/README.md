# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Tablet support

- **Breakpoint:** window width >= 768 dp is treated as a tablet (`TABLET_MIN_WIDTH` in `src/constants/theme.ts`). Below that, the original phone UI is shown.
- **Hook:** `useDeviceLayout()` from `@/hooks/use-device-layout` returns `isTablet`, `isLandscape`, `columns`, `contentMaxWidth`, `scale`, `width` and `height`. It updates live on rotation, split-screen and foldable changes. Don't use `Dimensions.get` for layout decisions.
- **Adding a tablet layout:** keep the phone path untouched; branch on `isTablet` or add tablet-only styles (see `tabletStyles` in `study.tsx`). Shared helpers: `ResponsiveContainer` and `MasterDetail` in `src/components/common`, `SideRail` in `src/components/navigation`.
- **Orientation:** `app.json` uses `"orientation": "default"`. `src/app/_layout.tsx` locks portrait on phones (physical short side < 600 dp) and unlocks rotation on tablets.
- **Native rebuild required:** the orientation setting and `expo-screen-orientation` need a new native build (e.g. rebuild `SaralVidhya.apk`). Fast refresh alone won't apply them.
