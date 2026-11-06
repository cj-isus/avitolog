import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'АВИТОЛОГ · рабочая область',
    description: 'Локальное сравнение объявлений и подготовка вопросов перед покупкой.',
    permissions: ['activeTab', 'scripting', 'sidePanel'],
    action: { default_title: 'Открыть АВИТОЛОГ' },
    minimum_chrome_version: '116',
  },
});
