import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL || '/admin/',
  build: { outDir: 'dist', assetsInlineLimit: 4096 }
})
```

Commit both files, wait for Actions green ✅.

---

But the real question is — **where are your files deployed?**

Go to **Actions** tab → latest successful run → click **deploy** step → it will show the exact URL like:
```
https://cybaash.github.io/
```
or
```
https://cybaash.github.io/cybaash/
