# 🎵 Jukebox 🍔
> **A Jukebox Social mais fofa e democrática do pedaço!** 🐱✨

![Badge em Desenvolvimento](https://img.shields.io/badge/Status-Em%20Desenvolvimento-ff007f)
![NodeJS](https://img.shields.io/badge/Backend-NodeJS-green)
![Socket.IO](https://img.shields.io/badge/RealTime-Socket.IO-white)

O **Jukebox** é um sistema interativo para restaurantes e eventos onde **o cliente é o DJ!** Chega de brigar pelo controle remoto: escaneie o QR Code, peça sua música e veja ela aparecer na TV do salão. Tudo isso supervisionado pelo nosso mascote, o Gatinho Floc. 😺

---

## 📸 Telas do Projeto

| 📺 A TV (Player) | 📱 O Celular (Controle) | 🔐 O Admin (Gestão) |
|:---:|:---:|:---:|
| *Onde a mágica acontece* | *Busca e pedidos* | *Controle total* |
| ![TV Screenshot](public/gato-active.png) | ![Mobile Screenshot](public/qrcode.png) | ![Admin Icon](https://cdn-icons-png.flaticon.com/512/2942/2942813.png) |

---

## 💖 Funcionalidades

### 📺 Para a TV (O Palco)
* **Player Automático:** Toca vídeos do YouTube em sequência sem parar.
* **Fila Visual:** Mostra quem pediu a música e qual mesa.
* **Mascote Reativo:** O gatinho dorme quando está parado e acorda para apresentar a lista! 💤➡️👀
* **Barra de Avisos:** Letreiro digital para promoções e recados.

### 📱 Para o Cliente (O Controle)
* **Busca Inteligente:** Pesquisa músicas direto no YouTube.
* **Segurança:** Só adiciona música quem tem a **Senha da Mesa** (fornecida pelo garçom).
* **Feedback:** Avisa se a música entrou na fila ou se deu erro.

### 👮‍♀️ Para o Admin (O Gerente)
* **Painel de Controle:** Pause, Play e Pular Música remotamente.
* **Volume Master:** Aumente ou diminua o som da TV pelo painel.
* **Gestão de Mesas:** Crie e exclua mesas com senhas dinâmicas.
* **Filtro +18:** Bloqueio automático de conteúdos impróprios.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi feito com muito carinho (e café ☕) usando:

* **Node.js & Express:** O cérebro do servidor.
* **Socket.io:** Para a mágica do tempo real (WebSockets).
* **YouTube Data API (via yt-search):** Para buscar os vídeos.
* **HTML5, CSS3 & JS Vanilla:** Frontend leve e responsivo.
* **Pixel Art:** Estética visual retrô.

---

## 🚀 Como Rodar o Projeto

Quer testar na sua máquina? É pra já!

### 1. Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.

### 2. Instalação
Clone este repositório e instale as dependências:

```bash
# Entre na pasta
cd jukebox

# Instale os pacotes
npm install

## 🔗 Acessando as Interfaces

Abra seu navegador (ou conecte o celular no mesmo Wi-Fi) e acesse:

* 📺 **TV:** `http://localhost:3001/tv.html`
* 📱 **Celular:** `http://localhost:3001/celular.html`
* 🔐 **Painel Admin:** `http://localhost:3001/admin.html`

> **Login Padrão do Admin:**
> * User: `admin`
> * Senha: `admin123`

---

## 👩‍💻 Autora

<img src="https://github.com/identicons/alice.png" width="50px" style="border-radius:50%">

**Alice Costa**
*Estudante de Tecnologia & Desenvolvedora Fullstack em formação.*

Gostou do projeto? Me dê uma estrelinha! ⭐  
Feito com 💜 e código.

---

### 📝 Licença
Este projeto é de uso educacional. Sinta-se livre para estudar e modificar!