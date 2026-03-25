# 📱 React Native/Flutter Setup Guide

Este documento descreve como migrar o RKMMAX para React Native/Flutter mantendo toda a funcionalidade de automação.

## 🎯 Estrutura do Projeto React Native

```
rkmmax-mobile/
├── src/
│   ├── screens/
│   │   ├── AutomationScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── SpecialistsScreen.tsx
│   ├── components/
│   │   ├── CommandInput.tsx
│   │   ├── AutomationCard.tsx
│   │   ├── SpecialistSelector.tsx
│   │   ├── ModeSelector.tsx
│   │   └── StatusBadge.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── audioService.ts
│   │   ├── cameraService.ts
│   │   ├── storageService.ts
│   │   └── automationService.ts
│   ├── hooks/
│   │   ├── useAutomation.ts
│   │   ├── useAudio.ts
│   │   ├── useCamera.ts
│   │   └── useStorage.ts
│   ├── types/
│   │   ├── automation.ts
│   │   ├── api.ts
│   │   └── user.ts
│   ├── utils/
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   └── App.tsx
├── android/
│   └── app/src/main/java/com/rkmmax/
│       ├── AutomationModule.java
│       ├── AudioRecorderModule.java
│       └── CameraModule.java
├── ios/
│   └── RKMMAX/
│       ├── AutomationModule.swift
│       ├── AudioRecorderModule.swift
│       └── CameraModule.swift
├── app.json
├── tsconfig.json
├── package.json
└── README.md
```

## 🔧 Dependências Necessárias

### Core
```json
{
  "react-native": "^0.73.0",
  "react-navigation": "^6.1.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/bottom-tabs": "^6.5.0",
  "@react-navigation/stack": "^6.3.0"
}
```

### Multimodal (Áudio/Imagem)
```json
{
  "react-native-audio-recorder-player": "^5.0.0",
  "react-native-camera": "^4.2.0",
  "react-native-image-picker": "^7.0.0",
  "react-native-fs": "^2.20.0"
}
```

### Storage & Dados
```json
{
  "@react-native-async-storage/async-storage": "^1.21.0",
  "realm": "^12.0.0"
}
```

### UI
```json
{
  "react-native-paper": "^5.10.0",
  "react-native-gesture-handler": "^2.14.0",
  "react-native-reanimated": "^3.6.0"
}
```

### Utilitários
```json
{
  "axios": "^1.6.0",
  "zustand": "^4.4.0",
  "react-native-device-info": "^10.6.0",
  "react-native-netinfo": "^11.0.0"
}
```

## 📋 Serviços Principais

### 1. API Service
```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = 'https://kizirianmax.site/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const automationAPI = {
  execute: (data) => api.post('/automation', { action: 'execute', ...data }),
  getHistory: (userId) => api.get(`/automation?action=history&userId=${userId}`),
  getStats: (userId) => api.get(`/automation?action=stats&userId=${userId}`),
  getSpecialists: () => api.get('/automation?action=specialists'),
};

export default api;
```

### 2. Audio Service
```typescript
// src/services/audioService.ts
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

const audioRecorder = new AudioRecorderPlayer();

export const audioService = {
  startRecording: async () => {
    const result = await audioRecorder.startRecording();
    return result;
  },

  stopRecording: async () => {
    const result = await audioRecorder.stopRecording();
    return result;
  },

  transcribe: async (audioPath) => {
    // Enviar para API de transcrição
    const formData = new FormData();
    formData.append('audio', {
      uri: audioPath,
      type: 'audio/mp3',
      name: 'recording.mp3',
    });

    const response = await fetch('https://kizirianmax.site/api/multimodal', {
      method: 'POST',
      body: formData,
    });

    return response.json();
  },
};
```

### 3. Camera Service
```typescript
// src/services/cameraService.ts
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

export const cameraService = {
  takePicture: async () => {
    return new Promise((resolve, reject) => {
      launchCamera({ mediaType: 'photo' }, (response) => {
        if (response.didCancel) {
          reject(new Error('Cancelado'));
        } else if (response.errorCode) {
          reject(new Error(response.errorMessage));
        } else {
          resolve(response.assets[0]);
        }
      });
    });
  },

  pickImage: async () => {
    return new Promise((resolve, reject) => {
      launchImageLibrary({ mediaType: 'photo' }, (response) => {
        if (response.didCancel) {
          reject(new Error('Cancelado'));
        } else if (response.errorCode) {
          reject(new Error(response.errorMessage));
        } else {
          resolve(response.assets[0]);
        }
      });
    });
  },

  analyzeImage: async (imagePath) => {
    // Enviar para API de análise
    const formData = new FormData();
    formData.append('image', {
      uri: imagePath,
      type: 'image/jpeg',
      name: 'image.jpg',
    });

    const response = await fetch('https://kizirianmax.site/api/multimodal', {
      method: 'POST',
      body: formData,
    });

    return response.json();
  },
};
```

### 4. Storage Service
```typescript
// src/services/storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageService = {
  setItem: async (key, value) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  getItem: async (key) => {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },

  removeItem: async (key) => {
    await AsyncStorage.removeItem(key);
  },

  clear: async () => {
    await AsyncStorage.clear();
  },
};
```

## 🎨 Componentes Principais

### 1. CommandInput Component
```typescript
// src/components/CommandInput.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const CommandInput = ({ onSubmit, onVoicePress, onImagePress }) => {
  const [text, setText] = useState('');

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Digite um comando..."
        value={text}
        onChangeText={setText}
        multiline
      />
      <View style={styles.buttons}>
        <TouchableOpacity onPress={onVoicePress}>
          <MaterialCommunityIcons name="microphone" size={24} color="#8b5cf6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onImagePress}>
          <MaterialCommunityIcons name="image" size={24} color="#8b5cf6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSubmit(text)}>
          <MaterialCommunityIcons name="send" size={24} color="#8b5cf6" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    marginRight: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
});
```

## 🔌 Módulos Nativos (Android/iOS)

### Android (Java)
```java
// android/app/src/main/java/com/rkmmax/AutomationModule.java
package com.rkmmax;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactMethod;

public class AutomationModule extends ReactContextBaseJavaModule {
  public AutomationModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "AutomationModule";
  }

  @ReactMethod
  public void executeAutomation(String command, Promise promise) {
    try {
      // Implementar lógica nativa
      promise.resolve("Automação executada");
    } catch (Exception e) {
      promise.reject("EXECUTE_ERROR", e);
    }
  }
}
```

### iOS (Swift)
```swift
// ios/RKMMAX/AutomationModule.swift
import Foundation

@objc(AutomationModule)
class AutomationModule: NSObject {
  @objc
  func executeAutomation(_ command: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    do {
      // Implementar lógica nativa
      resolve("Automação executada")
    } catch {
      reject("EXECUTE_ERROR", error.localizedDescription, error)
    }
  }
}
```

## 🚀 Implementação Passo a Passo

### 1. Criar projeto React Native
```bash
npx react-native init RKMMAXMobile --template typescript
cd RKMMAXMobile
```

### 2. Instalar dependências
```bash
npm install react-navigation @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-audio-recorder-player react-native-image-picker
npm install @react-native-async-storage/async-storage axios
```

### 3. Copiar serviços
```bash
cp -r ../src/automation ./src/services/
cp -r ../src/automation/MobileAdapter.js ./src/utils/
```

### 4. Configurar navegação
```typescript
// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AutomationScreen from '../screens/AutomationScreen';
import HistoryScreen from '../screens/HistoryScreen';
import StatsScreen from '../screens/StatsScreen';

const Tab = createBottomTabNavigator();

export const RootNavigator = () => (
  <NavigationContainer>
    <Tab.Navigator>
      <Tab.Screen name="Automação" component={AutomationScreen} />
      <Tab.Screen name="Histórico" component={HistoryScreen} />
      <Tab.Screen name="Estatísticas" component={StatsScreen} />
    </Tab.Navigator>
  </NavigationContainer>
);
```

### 5. Testar
```bash
npm run android
# ou
npm run ios
```

## 📦 Build & Deploy

### Android
```bash
cd android
./gradlew assembleRelease
# APK em: app/build/outputs/apk/release/
```

### iOS
```bash
cd ios
xcodebuild -workspace RKMMAX.xcworkspace -scheme RKMMAX -configuration Release
# IPA em: build/Release-iphoneos/
```

## 🔐 Segurança

- ✅ Usar HTTPS para todas as requisições
- ✅ Implementar autenticação OAuth 2.0
- ✅ Criptografar dados sensíveis localmente
- ✅ Validar permissões antes de acessar recursos
- ✅ Implementar rate limiting

## 📊 Performance

- ✅ Lazy loading de telas
- ✅ Otimizar renderização com React.memo
- ✅ Usar FlatList para listas grandes
- ✅ Implementar code splitting
- ✅ Monitorar memory leaks

## 🧪 Testes

```bash
npm test
npm run test:e2e
npm run test:coverage
```

## 📚 Referências

- [React Native Docs](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [Expo Docs](https://docs.expo.dev)
- [Firebase React Native](https://rnfirebase.io)
