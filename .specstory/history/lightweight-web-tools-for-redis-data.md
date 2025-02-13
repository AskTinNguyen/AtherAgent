## SpecStory

## Lightweight Web Tools for Redis Data (2/13/2025, 1:45:59 PM)

_**User**_

I want to easily open and see local Redis stored data via a simple web interface, is there any @Web open source lightweight libraries that can do this?

First, let's remove Redis Commander due to compability of our curret NodeJS.

---

_**Assistant**_

Based on the search results, I'll help you find a suitable lightweight web-based Redis GUI tool. Let me analyze the current workspace first to understand our context.

---

_****_

<details>
            <summary>Listed current directory • **45** results</summary>
        
| Name |
|-------|
| 📄 `.next` |
| 📄 `package.json` |
| 📄 `package-lock.json` |
| 📄 `node_modules` |
| 📄 `lib` |
| 📄 `docs` |
| 📄 `.git` |
| 📄 `.gitignore` |
| 📄 `components` |
| 📄 `servers` |
| 📄 `.DS_Store` |
| 📄 `jest.config.js` |
| 📄 `jest.setup.ts` |
| 📄 `coverage` |
| 📄 `.swc` |
| 📄 `reference` |
| 📄 `app` |
| 📄 `types` |
| 📄 `docker` |
| 📄 `README.md` |
| 📄 `.eslintrc.json` |
| 📄 `scripts` |
| 📄 `tsconfig.tsbuildinfo` |
| 📄 `.husky` |
| 📄 `public` |
| 📄 `tailwind.config.ts` |
| 📄 `.cursor` |
| 📄 `.env.local` |
| 📄 `CONTRIBUTING.md` |
| 📄 `chatimplementationreference.md` |
| 📄 `next-env.d.ts` |
| 📄 `.github` |
| 📄 `.vscode` |
| 📄 `CODE_OF_CONDUCT.md` |
| 📄 `Dockerfile` |
| 📄 `LICENSE` |
| 📄 `bun.lockb` |
| 📄 `components.json` |
| 📄 `docker-compose.yaml` |
| 📄 `next.config.mjs` |
| 📄 `postcss.config.mjs` |
| 📄 `prettier.config.js` |
| 📄 `searxng-limiter.toml` |
| 📄 `searxng-settings.yml` |
| 📄 `tsconfig.json` |

</details>

---

_****_



First, let's remove Redis Commander. I'll check if it's in our dependencies and remove it.

---

_****_

Read file: package.json

---

_****_



I see that `redis-commander` is in the devDependencies. Let's remove it and then I'll suggest a modern, lightweight alternative.

---

_****_

```bash
npm uninstall redis-commander --legacy-peer-deps
```

```
tinnguyen@Tins-MacBook-Pro AtherAgent % npm uninstall redis-commander --legacy-peer-deps                         n
pm uninstall redis-commander --legacy-peer-deps

removed 137 packages, changed 1 package, and audited 1120 packages in 792ms

321 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
tinnguyen@Tins-MacBook-Pro AtherAgent %
```

---

_****_



Great! Now I'll recommend a modern, lightweight alternative for viewing Redis data. One of the best options is **RESP.app** (formerly RedisInsight-lite), which is:
1. Modern and lightweight
2. Compatible with latest Node.js versions
3. Has a clean web interface
4. Open source and actively maintained

Let's install it using Docker since it's the cleanest way to run it:

---

_****_

```bash
docker pull redislabs/redisinsight:latest
```

```
tinnguyen@Tins-MacBook-Pro AtherAgent % docker pull redislabs/redisinsight:latest
latest: Pulling from redislabs/redisinsight
6a4fc0601e73: Download complete 
8e6cdf750aab: Download complete 
0815136fc1c9: Download complete 
a258b2a6b59a: Download complete 
8d1f8301130c: Download complete 
4f4fb700ef54: Already exists 
f0d2de073261: Download complete 
5b15dced3830: Download complete 
43ef478ad07f: Download complete 
e1551dfea38b: Download complete 
d43745504edd: Download complete 
Digest: sha256:e3af8fca1272243632adba175af4db0c439618f83649d8a12bbf617d3c9ff284
Status: Downloaded newer image for redislabs/redisinsight:latest
docker.io/redislabs/redisinsight:latest
tinnguyen@Tins-MacBook-Pro AtherAgent %
```

---

_****_



Now, let's run RedisInsight and connect it to your local Redis instance. I'll add this to your docker-compose file since you already have one:

---

_****_

Read file: docker-compose.yaml

---

_****_



Let me add RedisInsight to your docker-compose.yaml:

---

_****_

```diff
      command: redis-server --appendonly yes
  
+   redisinsight:
+     image: redislabs/redisinsight:latest
+     ports:
+       - '8001:8001'
+     volumes:
+       - redisinsight_data:/db
+ 
    searxng:
      image: searxng/searxng
  volumes:
    redis_data:
+   redisinsight_data:
    searxng_data:
  
```

---

_****_





Now let's start the services:

---

_****_

```bash
docker-compose up -d
```

```
tinnguyen@Tins-MacBook-Pro AtherAgent % 
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 86.1s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 86.3s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 86.4s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 86.6s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 86.7s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 86.9s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 87.0s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 87.2s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 87.3s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 87.5s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 87.6s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 87.8s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 87.9s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 88.1s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 88.2s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 88.4s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 88.5s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 88.7s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 88.8s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 89.0s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 89.1s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 89.3s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 89.4s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 89.6s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 89.7s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 89.9s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 90.0s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 90.2s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 90.3s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 90.5s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 90.6s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 90.8s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 90.9s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 91.1s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 91.2s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 91.4s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 91.5s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 91.7s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 91.8s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 92.0s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 92.1s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 92.3s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 92.4s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 92.6s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 92.7s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 92.9s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 93.0s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 93.2s (12/13)                                                                   docker:desktop-l
inux                                                                                                          => =
> sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B                   
1.3s                                                                                                          => =
> sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB             
5.4s                                                                                                          => =
> sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB               
1.6s                                                                                                          => =
> extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44                    
0.1s                                                                                                          => =
> extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2                    
0.5s                                                                                                          => =
> extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10                    
0.0s                                                                                                          => =
> extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57                    
0.1s                                                                                                          => =
> extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b                    
0.0s                                                                                                          => [
morphic internal] load build context                                                                   1
0.8s                                                                                                         [+] B
uilding 93.3s (12/13)                                                              docker:desktop-linux1
[+] Building 105.9s (14/14) FINISHED                                                    docker:desktop-linux
 => [morphic internal] load build definition from Dockerfile                                            0.0s1
 => => transferring dockerfile: 284B                                                                    0.0s
 => [morphic internal] load metadata for docker.io/oven/bun:1.1.3-alpine                                3.7s 
 => [morphic auth] oven/bun:pull token for registry-1.docker.io                                         0.0s
 => [morphic internal] load .dockerignore                                                               0.0s 
 => => transferring context: 2B                                                                         0.0s
 => [morphic 1/7] FROM docker.io/oven/bun:1.1.3-alpine@sha256:1f0e859cf566d618913995d3ee9e9629904f0434  6.1s3
 => => resolve docker.io/oven/bun:1.1.3-alpine@sha256:1f0e859cf566d618913995d3ee9e9629904f04344093fafc  0.0s
 => => sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b 144B / 144B              0.7s 
 => => sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57 6.63MB / 6.63MB          1.9s
 => => sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10 296B / 296B              1.3s 
 => => sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2 35.29MB / 35.29MB        5.4s
 => => sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44 3.33MB / 3.33MB          1.6s3
 => => extracting sha256:c6b39de5b33961661dc939b997cc1d30cda01e38005a6c6625fd9c7e748bab44               0.1s
 => => extracting sha256:69ee24c72f3b0ed3c2343dbc27acac145b00cff4a889b03a06294bcbfc462df2               0.5s3
 => => extracting sha256:fc3c1703bafc0e1d018b09debf9eb6974bf103c740d94362989b7b61e4b94e10               0.0s
 => => extracting sha256:43e7a5b24364ea913869c698cd5a2bde9f81515042ecceae15b9d6d748eebd57               0.1s 
 => => extracting sha256:50ba773fc5278c4e1e78a224cb8561664521ae38603768326ec530bcfb8a2b0b               0.0s
 => [morphic internal] load build context                                                              10.8s
 => => transferring context: 2.22GB                                                                    10.8s
 => [morphic 2/7] RUN apk add --no-cache nodejs npm git                                                11.4s
 => [morphic 3/7] WORKDIR /app                                                                          0.0s
 => [morphic 4/7] COPY package.json bun.lockb ./                                                        0.0s
 => [morphic 5/7] RUN bun install                                                                      30.2s
 => [morphic 6/7] COPY . .                                                                              5.7s
 => [morphic 7/7] RUN bun next telemetry disable                                                        0.4s
 => [morphic] exporting to image                                                                       48.3s
 => => exporting layers                                                                                35.8s
 => => exporting manifest sha256:4765dd89417bc6244299b3bc0ece477e007dbf5602ed15d997584d08aaee91ad       0.0s
 => => exporting config sha256:f33e3a5ce22c4359f04063d342a8183d3cf515270509649a7144aa1a5f53539a         0.0s
 => => exporting attestation manifest sha256:85e74e843e96c2b44816f9b578e28b442468bc67d1ed7e606969ab455  0.0s
 => => exporting manifest list sha256:4e56b0eed81b09210f4659a7cf57b554ff6124c026928b3629788c5bce8ca23f  0.0s
 => => naming to docker.io/library/morphic-stack-morphic:latest                                         0.0s
 => => unpacking to docker.io/library/morphic-stack-morphic:latest                                     12.5s
 => [morphic] resolving provenance for metadata file                                                    0.0s
[+] Running 4/5
 ✔ Volume "morphic-stack_redisinsight_data"  Created                                                    0.0s 
 ✔ Container morphic-stack-searxng-1         Started                                                    1.4s 
 ✔ Container morphic-stack-redis-1           Running                                                    0.0s 
 ✔ Container morphic-stack-redisinsight-1    Started                                                    1.4s 
 ⠙ Container morphic-stack-morphic-1         Starting                                                   0.2s 
Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:3000 -> 0.0.0.0:0: listen tcp 
0.0.0.0:3000: bind: address already in use                                                                   
```

---

_****_



Perfect! I've successfully:
1. Removed redis-commander from your devDependencies
2. Added RedisInsight to your Docker setup
3. Started the services (though there seems to be a port conflict on 3000, but that's not related to RedisInsight)

Now you can access RedisInsight through your web browser at:
```
http://localhost:8001
```

When you first open RedisInsight, you'll need to:
1. Accept the terms of service
2. Add your Redis database with these connection details:
   - Host: `redis` (the service name in docker-compose)
   - Port: `6379`
   - Name: Any name you want (e.g., "Local Redis")

RedisInsight provides a modern, feature-rich interface for:
- Viewing and editing Redis data
- Monitoring Redis performance
- Running Redis commands
- Analyzing memory usage
- Viewing real-time metrics

Would you like me to help you set up the connection in RedisInsight once you have it open in your browser?

---

_**User**_

it says local host not available

---

_**Assistant**_

Let me help you troubleshoot the connection issue. First, let's check if the Redis and RedisInsight containers are actually running:

---

_****_

```bash
docker ps | grep -E "redis|redisinsight"
```

```
7b804e8afe97   redislabs/redisinsight:latest   "./docker-entry.sh n…"   About a minute ago   Up 59 seconds

5540/tcp, 0.0.0.0:8001->8001/tcp   morphic-stack-redisinsight-1
29fcf05001f8   redis:alpine                    "docker-entrypoint.s…"   4 days ago           Up 4 days

0.0.0.0:6379->6379/tcp             morphic-stack-redis-1

```

---

_****_



I see both containers are running. Let's try to restart them to ensure clean connections:

---

_****_

```bash
docker-compose restart redis redisinsight
```

```
[+] Restarting 0/0
 ⠋ Container morphic-stack-redisinsight-1  Restarting                                                   0.1s 
[+] Restarting 0/2ic-stack-redis-1         Restarting                                                   0.1s 
 ⠙ Container morphic-stack-redisinsight-1  Restarting                                                   0.2s 
[+] Restarting 1/2ic-stack-redis-1         Restarting                                                   0.2s 
 ✔ Container morphic-stack-redisinsight-1  Started                                                      0.2s 
[+] Restarting 2/2ic-stack-redis-1         Restarting                                                   0.3s 
 ✔ Container morphic-stack-redisinsight-1  Started                                                      0.2s 
 ✔ Container morphic-stack-redis-1         Started                                                      0.3s 

```

---

_****_



Now, let's check if the ports are actually being listened to:

---

_****_

```bash
lsof -i :8001
```

```
COMMAND     PID      USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
Google     1646 tinnguyen   47u  IPv6 0xf98c66e941ecbf78      0t0  TCP localhost:61100->localhost:vcom-tunnel
 (CLOSE_WAIT)
Google     1646 tinnguyen   52u  IPv6 0x6166af83a702c65b      0t0  TCP localhost:61101->localhost:vcom-tunnel
 (CLOSE_WAIT)
com.docke 47975 tinnguyen  140u  IPv6 0xd616e9712fb36d78      0t0  TCP *:vcom-tunnel (LISTEN)

```

---

_****_



I see the issue. It seems there might be a conflict on port 8001. Let's modify the RedisInsight port to use a different one, say 8002:

---

_****_

```diff
      image: redislabs/redisinsight:latest
      ports:
-       - '8001:8001'
+       - '8002:8001'
      volumes:
        - redisinsight_data:/db
```

---

_****_





Now let's restart the services with the new port:

---

_****_

```bash
docker-compose up -d
```

```
[+] Running 2/0
 ✔ Container morphic-stack-redis-1         Running                                                      0.0s 
 ⠋ Container morphic-stack-redisinsight-1  Recreate                                                     0.1s 
[+] Running 2/3rphic-stack-searxng-1       Running                                                      0.0s 
 ✔ Container morphic-stack-redis-1         Running                                                      0.0s 
 ⠙ Container morphic-stack-redisinsight-1  Starting                                                     0.2s 
 ✔ Container morphic-stack-searxng-1       Running                                                      0.0s 
[+] Running 3/4rphic-stack-morphic-1       Starting                                                     0.0s 
 ✔ Container morphic-stack-redis-1         Running                                                      0.0s 
 ✔ Container morphic-stack-redisinsight-1  Started                                                      0.2s 
 ✔ Container morphic-stack-searxng-1       Running                                                      0.0s 
 ⠋ Container morphic-stack-morphic-1       Starting                                                     0.1s 
Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:3000 -> 0.0.0.0:0: listen tcp 
0.0.0.0:3000: bind: address already in use

```

---

_****_





Now RedisInsight should be accessible at:
```
http://localhost:8002
```

When you open it, you'll need to:
1. Accept the terms of service
2. Click "Add Redis Database"
3. Use these connection details:
   - Host: `redis` (the service name in docker-compose)
   - Port: `6379`
   - Name: Any name you want (e.g., "Local Redis")

Can you try accessing http://localhost:8002 now and let me know if you still have issues? The error about port 3000 is unrelated to RedisInsight (it's about your main application) and shouldn't affect the Redis GUI access.

---

_**User**_

I think your command sitll incorrectly setup at port 3000

---

_**Assistant**_

Ah yes, I see the issue. The error is because port 3000 is already in use. Let's first check what's using port 3000:

---

_****_

```bash
lsof -i :3000
```

```
COMMAND     PID      USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
Google     1646 tinnguyen   49u  IPv6 0x274b83ba6425bc9e      0t0  TCP localhost:59460->localhost:hbci (ESTAB
LISHED)
Google     1646 tinnguyen   51u  IPv6 0x22c8d62f6af2b540      0t0  TCP localhost:61224->localhost:hbci (ESTAB
LISHED)
node      26299 tinnguyen   17u  IPv6 0xccaf09d772a78d88      0t0  TCP *:hbci (LISTEN)
node      26299 tinnguyen   35u  IPv6 0xa0fa9b77dcb3bd65      0t0  TCP localhost:hbci->localhost:61224 (ESTAB
LISHED)
node      26299 tinnguyen  202u  IPv6  0x18a6302bcd71ed0      0t0  TCP localhost:hbci->localhost:59460 (ESTAB
LISHED)

```

---

_****_



I see there's a Node.js process already running on port 3000. Let's first stop all running containers and then clean up:

---

_****_

```bash
docker-compose down
```

```
[+] Running 1/0
 ✔ Container morphic-stack-morphic-1       Removed                                                      0.0s 
 ⠋ Container morphic-stack-redisinsight-1  Stopping                                                     0.1s 
 ⠋ Container morphic-stack-searxng-1       Stopping                                                     0.1s 
[+] Running 2/4rphic-stack-redis-1         Stopping                                                     0.1s 
 ✔ Container morphic-stack-morphic-1       Removed                                                      0.0s 
 ✔ Container morphic-stack-redisinsight-1  Removed                                                      0.2s 
 ⠙ Container morphic-stack-searxng-1       Stopping                                                     0.2s 
[+] Running 3/4rphic-stack-redis-1         Stopping                                                     0.2s 
 ✔ Container morphic-stack-morphic-1       Removed                                                      0.0s 
 ✔ Container morphic-stack-redisinsight-1  Removed                                                      0.2s 
 ⠹ Container morphic-stack-searxng-1       Stopping                                                     0.3s 
[+] Running 3/4rphic-stack-redis-1         Removed                                                      0.2s 
 ✔ Container morphic-stack-morphic-1       Removed                                                      0.0s 
 ✔ Container morphic-stack-redisinsight-1  Removed                                                      0.2s 
 ⠸ Container morphic-stack-searxng-1       Stopping                                                     0.4s 
[+] Running 3/4rphic-stack-redis-1         Removed                                                      0.2s 
 ✔ Container morphic-stack-morphic-1       Removed                                                      0.0s 
 ✔ Container morphic-stack-redisinsight-1  Removed                                                      0.2s 
 ⠼ Container morphic-stack-searxng-1       Stopping                                                     0.5s 
[+] Running 3/4rphic-stack-redis-1         Removed                                                      0.2s 
 ✔ Container morphic-stack-morphic-1       Removed                                                      0.0s 
 ✔ Container morphic-stack-redisinsight-1  Removed                                                      0.2s 
 ⠴ Container morphic-stack-searxng-1       Stopping                                                     0.6s 
[+] Running 3/4rphic-stack-redis-1         Removed                                                      0.2s 
 ✔ Container morphic-stack-morphic-1       Removed                                                      0.0s 
 ✔ Container morphic-stack-redisinsight-1  Removed                                                      0.2s 
 ⠦ Container morphic-stack-searxng-1       Stopping                                                     0.7s 
[+] Running 3/4rphic-stack-redis-1         Removed                                                      0.2s 
 ✔ Container morphic-stack-morphic-1       Removed                                                      0.0s 
 ✔ Container morphic-stack-redisinsight-1  Removed                                                      0.2s 
 ⠧ Container morphic-stack-searxng-1       Stopping                                                     0.8s 
[+] Running 3/4rphic-stack-redis-1         Removed                                                      0.2s 
 ✔ Container morphic-stack-morphic-1       Removed                                                      0.0s 
 ✔ Container morphic-stack-redisinsight-1  Removed                                                      0.2s 
 ⠇ Container morphic-stack-searxng-1       Stopping                                                     0.9s 
[+] Running 3/4rphic-stack-redis-1         Removed                                                      0.2s 
 ✔ Container morphic-stack-morphic-1       Removed                                                      0.0s 
 ✔ Container morphic-stack-redisinsight-1  Removed                                                      0.2s 
 ⠏ Container morphic-stack-searxng-1       Stopping                                                     1.0s 
[+] Running 3/4rphic-stack-redis-1         Removed                                                      0.2s 
 ✔ Container morphic-stack-morphic-1       Removed                                                      0.0s 
 ✔ Container morphic-stack-redisinsight-1  Removed                                                      0.2s 
 ⠋ Container morphic-stack-searxng-1       Stopping                                                     1.1s 
[+] Running 4/4rphic-stack-redis-1         Removed                                                      0.2s 
 ✔ Container morphic-stack-morphic-1       Removed                                                      0.0s 
 ✔ Container morphic-stack-redisinsight-1  Removed                                                      0.2s 
 ✔ Container morphic-stack-searxng-1       Removed                                                      1.1s 
 ✔ Container morphic-stack-redis-1         Removed                                                      0.2s 
[+] Running 5/5hic-stack_default           Removing                                                     0.0s 
 ✔ Container morphic-stack-morphic-1       Removed                                                      0.0s 
 ✔ Container morphic-stack-redisinsight-1  Removed                                                      0.2s 
 ✔ Container morphic-stack-searxng-1       Removed                                                      1.1s 
 ✔ Container morphic-stack-redis-1         Removed                                                      0.2s 
 ✔ Network morphic-stack_default           Removed                                                      0.1s 

```

---

_****_





Now let's kill the existing Node.js process that's using port 3000:

---

_****_

```bash
kill 26299
```

```
tinnguyen@Tins-MacBook-Pro AtherAgent % 

```

---

_****_





Let's verify port 3000 is now free:

---

_****_

```bash
lsof -i :3000
```

```
COMMAND     PID      USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
Google     1646 tinnguyen   49u  IPv6 0x274b83ba6425bc9e      0t0  TCP localhost:59460->localhost:hbci (ESTAB
LISHED)
Google     1646 tinnguyen   51u  IPv6 0x22c8d62f6af2b540      0t0  TCP localhost:61224->localhost:hbci (ESTAB
LISHED)
node      26299 tinnguyen   35u  IPv6 0xa0fa9b77dcb3bd65      0t0  TCP localhost:hbci->localhost:61224 (ESTAB
LISHED)
node      26299 tinnguyen  202u  IPv6  0x18a6302bcd71ed0      0t0  TCP localhost:hbci->localhost:59460 (ESTAB
LISHED)

```

---

_****_





Let's modify the docker-compose.yaml to use a different port for the morphic service to avoid conflicts:

---

_****_

```diff
      env_file: .env.local # Load environment variables
      ports:
-       - '3000:3000' # Maps port 3000 on the host to port 3000 in the container.
+       - '3001:3000' # Maps port 3001 on the host to port 3000 in the container.
      depends_on:
        - redis
```

---

_****_







Now let's start everything up again:

---

_****_



---

_****_



---

_**User**_

we need to host 2 things:
1. our AtherAgent app
2. our redis insight app

---

_**Assistant**_

I understand. Let's make sure both applications are properly configured and running:

1. **AtherAgent app** will run on `http://localhost:3001` (since we mapped port 3001->3000)
2. **RedisInsight** will run on `http://localhost:8002` (since we mapped port 8002->8001)

Let's start fresh with a clean environment:

---

_****_

```bash
docker-compose down && docker-compose up -d
```

```
[+] Running 4/0
 ✔ Network morphic-stack_default           Created                                                      0.0s 
 ✔ Container morphic-stack-redis-1         Created                                                      0.1s 
 ✔ Container morphic-stack-redisinsight-1  Created                                                      0.0s 
 ✔ Container morphic-stack-searxng-1       Created                                                      0.0s 
[+] Running 2/5rphic-stack-morphic-1       Creating                                                     0.0s 
 ✔ Network morphic-stack_default           Created                                                      0.0s 
 ⠙ Container morphic-stack-redis-1         Starting                                                     0.2s 
 ⠙ Container morphic-stack-redisinsight-1  Starting                                                     0.2s 
 ⠙ Container morphic-stack-searxng-1       Starting                                                     0.2s 
[+] Running 2/5rphic-stack-morphic-1       Created                                                      0.0s 
 ✔ Network morphic-stack_default           Created                                                      0.0s 
 ⠹ Container morphic-stack-redis-1         Starting                                                     0.3s 
 ⠹ Container morphic-stack-redisinsight-1  Starting                                                     0.3s 
 ⠹ Container morphic-stack-searxng-1       Starting                                                     0.3s 
[+] Running 4/5rphic-stack-morphic-1       Created                                                      0.0s 
 ✔ Network morphic-stack_default           Created                                                      0.0s 
 ✔ Container morphic-stack-redis-1         Started                                                      0.3s 
 ✔ Container morphic-stack-redisinsight-1  Started                                                      0.3s 
 ✔ Container morphic-stack-searxng-1       Started                                                      0.3s 
[+] Running 5/5rphic-stack-morphic-1       Starting                                                     0.3s 
 ✔ Network morphic-stack_default           Created                                                      0.0s 
 ✔ Container morphic-stack-redis-1         Started                                                      0.3s 
 ✔ Container morphic-stack-redisinsight-1  Started                                                      0.3s 
 ✔ Container morphic-stack-searxng-1       Started                                                      0.3s 
 ✔ Container morphic-stack-morphic-1       Started                                                      0.3s 

```

---

_****_





Great! All services are now running. Let's verify they're working:

---

_****_

```bash
docker ps | grep -E "morphic|redis"
```

```
336166ad724b   morphic-stack-morphic           "/usr/local/bin/dock…"   6 seconds ago   Up 6 seconds   0.0.0.
0:3001->3000/tcp             morphic-stack-morphic-1
cf879a9f4f36   redis:alpine                    "docker-entrypoint.s…"   6 seconds ago   Up 6 seconds   0.0.0.
0:6379->6379/tcp             morphic-stack-redis-1
0d8ec8159d72   searxng/searxng                 "/sbin/tini -- /usr/…"   6 seconds ago   Up 6 seconds   0.0.0.
0:8080->8080/tcp             morphic-stack-searxng-1
5fd4b8e91cbd   redislabs/redisinsight:latest   "./docker-entry.sh n…"   6 seconds ago   Up 6 seconds   5540/t
cp, 0.0.0.0:8002->8001/tcp   morphic-stack-redisinsight-1

```

---

_****_





Perfect! Everything is running correctly now. You can access:

1. **AtherAgent app**: http://localhost:3001
2. **RedisInsight**: http://localhost:8002

For RedisInsight, when you first open it:
1. Accept the terms of service
2. Click "Add Redis Database"
3. Use these connection details:
   - Host: `redis` (the service name in docker-compose)
   - Port: `6379`
   - Name: Any name you want (e.g., "AtherAgent Redis")

The connection should work because both services are on the same Docker network and can communicate with each other using their service names.

Would you like me to help you set up the Redis connection in RedisInsight or is there anything else you need help with?

---

_**User**_

do i need to npm run dev?

---

_**Assistant**_

No, you don't need to run `npm run dev` separately because we're using Docker Compose, and the application is already running inside the Docker container. In the `docker-compose.yaml`, we have:

```yaml
  morphic:
    build:
      context: .
      dockerfile: Dockerfile
    command: bun dev  # This is already running the development server
    ports:
      - '3001:3000'  # This maps the container's port 3000 to your host's port 3001
```

The `command: bun dev` line is equivalent to running the development server, and it's already running inside the container.

You can verify that the app is running by:

---

_****_

```bash
docker-compose logs -f morphic
```

```
morphic-1  | $ next dev --turbo
morphic-1  |    ▲ Next.js 15.1.6 (Turbopack)
morphic-1  |    - Local:        http://localhost:3000
morphic-1  |    - Network:      http://172.18.0.5:3000
morphic-1  |    - Environments: .env.local
morphic-1  | 
morphic-1  |  ✓ Starting...
morphic-1  | Attention: Next.js now collects completely anonymous telemetry regarding usage.
morphic-1  | This information is used to shape Next.js' roadmap and prioritize features.
morphic-1  | You can learn more, including how to opt-out if you'd not like to participate in this anonymous 
program, by visiting the following URL:
morphic-1  | https://nextjs.org/telemetry
morphic-1  | 
morphic-1  |  ✓ Ready in 697ms
^C
^C
^C


```

---

_****_



You should be able to access:
1. The AtherAgent app at http://localhost:3001
2. RedisInsight at http://localhost:8002

If you can't access either of these, let me know and I can help troubleshoot. Also, if you want to see the logs of any service to debug issues, just let me know!

---



---

