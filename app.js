const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () =>
      console.log("Server Running at http://localhost:3003/")
    );
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertingPlayer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertingMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM 
      player_details;`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(playersArray.map((each) => convertingPlayer(each)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      * 
    FROM 
      player_details
    WHERE 
      player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertingPlayer(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE 
      player_details
    SET 
      player_name = '${playerName}'
    WHERE 
      player_id = ${playerId};`;

  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
      * 
    FROM 
      match_details
    WHERE 
      match_id = ${matchId};`;
  const match = await database.get(getMatchQuery);
  response.send(convertingMatch(match));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersUsingMatchIdQuery = `
    SELECT 
      * 
    FROM 
      player_match_score NATURAL JOIN player_details
    WHERE 
      match_id = ${matchId};`;
  const playerDetails = await database.all(getPlayersUsingMatchIdQuery);
  response.send(playerDetails.map((each) => convertingPlayer(each)));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesUsingPlayerIdQuery = `
    SELECT 
      * 
    FROM 
      player_match_score NATURAL JOIN match_details
    WHERE 
      player_id = ${playerId};`;
  const matchDetails = await database.all(getMatchesUsingPlayerIdQuery);
  response.send(matchDetails.map((each) => convertingMatch(each)));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getTotalQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM 
      player_match_score NATURAL JOIN player_details
    WHERE 
      player_id = ${playerId};`;
  const playersScoreTotal = await database.get(getTotalQuery);
  response.send(playersScoreTotal);
});

module.exports = app;
