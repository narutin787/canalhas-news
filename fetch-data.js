const fs = require('fs');
const path = require('path');

// Configurações
const API_KEY = process.env.PANDASCORE_KEY; // A chave virá do GitHub Secrets
const TEAM_ID = 1266; // ID da RED Canids (Confirme se é este mesmo)
const OUTPUT_FILE = path.join(__dirname, 'data', 'matches.json');

// Mapeamento de Slugs da PandaScore para nossas categorias
const GAME_MAP = {
    'league-of-legends': 'lol',
    'cs-go': 'cs2',
    'valorant': 'valorant'
};

async function fetchUpcomingMatches() {
    if (!API_KEY) {
        console.error('ERRO: Chave da API não encontrada.');
        process.exit(1);
    }

    try {
        console.log('Buscando partidas futuras...');
        
        // Busca partidas onde a RED Canids (ID 1266) está jogando
        // filter[status]=not_started garante apenas jogos futuros
        const url = `https://api.pandascore.co/matches/upcoming?filter[opponent_id]=${TEAM_ID}&sort=begin_at&token=${API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro na API: ${response.statusText}`);
        
        const matches = await response.json();
        
        // Transforma os dados complexos da API no formato simples do nosso site
        const simplifiedMatches = matches.map(match => {
            // Encontra o oponente (quem NÃO é a RED Canids)
            const opponent = match.opponents.find(op => op.opponent.id !== TEAM_ID)?.opponent;
            
            // Define a categoria do jogo (LoL, CS2, etc)
            const gameSlug = match.videogame.slug;
            const gameCategory = GAME_MAP[gameSlug] || 'outros';

            return {
                game: gameCategory,
                league: match.league.name + (match.serie ? ` - ${match.serie.full_name}` : ''),
                date: match.begin_at,
                opponent: opponent ? opponent.name : 'A Definir',
                logo: opponent ? opponent.image_url : null
            };
        });

        console.log(`Encontradas ${simplifiedMatches.length} partidas.`);

        // Garante que a pasta 'data' existe
        const dir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        // Salva o arquivo JSON
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(simplifiedMatches, null, 2));
        console.log('Arquivo data/matches.json atualizado com sucesso!');

    } catch (error) {
        console.error('Falha ao buscar dados:', error);
        // Não quebra o build, apenas avisa
        process.exit(1);
    }
}

fetchUpcomingMatches();