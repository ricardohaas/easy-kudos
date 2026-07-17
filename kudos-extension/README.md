# Kudos Manager - Extensão Chrome

Uma extensão Chrome para facilitar o envio de kudos durante sprints.

## Instalação

1. Abra o Chrome e acesse `chrome://extensions/`
2. Ative o "Modo desenvolvedor" (canto superior direito)
3. Clique em "Carregar extensão sem compactação"
4. Selecione a pasta `kudos-extension`
5. A extensão estará disponível na barra de ferramentas

## Funcionalidades

### Criar Kudos
1. Selecione qualquer texto em uma página web
2. Clique com o botão direito
3. Selecione "Criar Kudo com..."
4. Preencha o formulário:
   - **Destinatário**: Selecione um membro da equipe ou digite um nome
   - **Adicionar à equipe**: Marque para salvar o novo nome na equipe
   - **Mensagem**: Adicione uma mensagem opcional
   - **Categoria**: Escolha entre Ajuda, Colaboração, Inovação, Qualidade ou Outro
5. Clique em "Salvar Kudo"

### Gerenciar Equipe
- Acesse a aba "Equipe" no popup
- Adicione membros apenas com o primeiro nome
- Os membros aparecerão na lista de destinatários ao criar kudos
- **Exportar Equipe**: Salva a lista de membros em um arquivo JSON
- **Importar Equipe**: Carrega membros de um arquivo JSON (evita duplicatas)

### Filtrar e Exportar Kudos
- **Filtrar por data**: Use os campos "De" e "Até" para filtrar kudos
- **Exportar Filtrados**: Exporta apenas os kudos filtrados
- **Exportar Todos**: Exporta todos os kudos independentemente do filtro
- **Importar JSON**: Carrega kudos e membros de um arquivo JSON completo
- **Limpar Kudos**: Apaga todos os kudos (faz backup automático antes)
- **Editar Data**: Clique no ícone ✏️ para alterar a data de um kudo

## Estrutura do JSON Exportado

### Exportação de Kudos
```json
{
  "exportDate": "2026-07-17T10:00:00.000Z",
  "version": "1.0",
  "filtered": false,
  "dateRange": {
    "from": "2026-07-01",
    "to": "2026-07-17"
  },
  "kudos": [
    {
      "id": 1234567890,
      "recipient": "João",
      "text": "Texto selecionado",
      "message": "Mensagem opcional",
      "category": "ajuda",
      "url": "https://exemplo.com",
      "pageTitle": "Título da Página",
      "timestamp": 1234567890,
      "createdAt": "2026-07-17T10:00:00.000Z"
    }
  ],
  "teamMembers": [
    {
      "name": "João",
      "addedAt": "2026-07-17T10:00:00.000Z"
    }
  ]
}
```

### Exportação de Equipe
```json
{
  "exportDate": "2026-07-17T10:00:00.000Z",
  "version": "1.0",
  "type": "team",
  "teamMembers": [
    {
      "name": "João",
      "addedAt": "2026-07-17T10:00:00.000Z"
    },
    {
      "name": "Maria",
      "addedAt": "2026-07-17T10:00:00.000Z"
    }
  ]
}
```

## Armazenamento

Os dados são salvos localmente no navegador usando `chrome.storage.local`:
- **Kudos**: Lista de todos os kudos criados
- **Equipe**: Lista de membros da equipe (apenas primeiro nome)
- **Dados persistem** entre sessões do navegador

## Categorias Disponíveis

- **Ajuda**: Quando alguém ajudou outro membro
- **Colaboração**: Trabalho em conjunto
- **Inovação**: Ideias criativas ou soluções inovadoras
- **Qualidade**: Excelência no trabalho executado
- **Outro**: Outros tipos de reconhecimento

## Dicas

- Use a aba "Equipe" para pré-cadastrar membros e agilizar o processo
- Ao digitar um nome novo no kudo, marque "Adicionar à equipe" para salvá-lo automaticamente
- Exporte a equipe para compartilhar com outros membros do time
- Importe a equipe de colegas para manter a lista sincronizada
- Exporte regularmente seus kudos para backup
- Use o filtro de data para exportar kudos de um período específico
- Apenas primeiro nome é salvo para proteger a privacidade dos membros
