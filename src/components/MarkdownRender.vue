<template>
  <div class="markdown-body" v-html="rendered"></div>
</template>

<script lang="ts" setup>
import axios from 'axios';
import MarkdownIt from 'markdown-it';
import * as Prism from 'prismjs';
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-diff'
import 'prismjs/components/prism-graphql'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-kotlin'
import 'prismjs/components/prism-less'
import 'prismjs/components/prism-lua'
import 'prismjs/components/prism-makefile'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-objectivec'
import 'prismjs/components/prism-perl'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-markup-templating'
// import 'prismjs/components/prism-plaintext'
// import 'prismjs/components/prism-python-repl'
import 'prismjs/components/prism-r'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-scss'
// import 'prismjs/components/prism-shell'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-swift'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-basic'
import 'prismjs/components/prism-vbnet'
import 'prismjs/components/prism-wasm'
// import 'prismjs/components/prism-xml'
import 'prismjs/components/prism-yaml'

const langSubset = [
  'python',
  'javascript',
  'java',
  'go',
  'bash',
  'c',
  'cpp',
  'csharp',
  'css',
  'diff',
  'graphql',
  'json',
  'kotlin',
  'less',
  'lua',
  'makefile',
  'markdown',
  'objectivec',
  'perl',
  'php',
  'php-template',
  'plaintext',
  'python-repl',
  'r',
  'ruby',
  'rust',
  'scss',
  'shell',
  'sql',
  'swift',
  'typescript',
  'vbnet',
  'wasm',
  'xml',
  'yaml',
];

import { computed, defineProps, onMounted, ref, watch } from 'vue';

const props = defineProps({
  page: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    default: ''
  }
});

const content = ref('Loading...');

const md = new MarkdownIt({
  highlight: (str: string, lang: string) => {
    const bar = `<div><span>${lang}</span><button
          className="ml-auto flex gap-2"></button></div>`
    if (lang && Prism.languages[lang]) {
      try {
        return `${bar}<pre class="language-${lang}"><code>${Prism.highlight(
          str,
          Prism.languages[lang],
          lang
        )}</code></pre>`;
      } catch (e) {
        console.error(e)
      }
    }

    return `${bar}<pre class="language-plaintext"><code>${md.utils.escapeHtml(
      str
    )}</code></pre>`;
  }
});

const rendered = computed(() => md.render(content.value))

onMounted(() => {
  if (false) {
    const lines = langSubset.map(x => `import 'prismjs/components/prism-${x}'`)
    console.log(lines.join('\n'))
    console.log(Prism.languages)
  }

  if (props.source) {
    content.value = props.source;
  } else {
    loadPage(props.page);
  }
});

const loadPage = async (page) => {
  if (!page) return; // If page prop is not provided, do nothing
  const resolvedPage = page.endsWith('.md') ? page : `${page}.md`; // Auto append .md
  try {
    const response = await axios.get('/md/' + resolvedPage);
    content.value = response.data;
  } catch (error) {
    content.value = resolvedPage + ':' + error?.message;
  }
};

watch(() => props.page, (val) => {
  loadPage(val);
});

</script>

<style>
@import 'prismjs/themes/prism.css';

</style>
