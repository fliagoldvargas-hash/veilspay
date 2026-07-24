# Ghost Protocol Config

Para cambiar el CA que aparece en la web, abrí:

```txt
config/CONTRACT_ADDRESS.txt
```

Pegá ahí el contrato nuevo en una sola línea y guardá el archivo.

Después ejecutá:

```bash
npm run build
```

Eso actualiza `config.js`, que es el archivo público que lee la web.
