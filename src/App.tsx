import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

interface Team {
  name: string;
  abbr: string;
  offRating: number;
  defRating: number;
  pace: number;
  recentForm: number;
  homeAway: 'home' | 'away';
}

interface Prediction {
  winner: string;
  winProbability: number;
  predictedScore: { home: number; away: number };
  totalPoints: number;
  overUnderLine: number;
  overProbability: number;
  spreadLine: number;
  spreadCover: string;
  spreadProbability: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

const NBA_TEAMS = [
  { name: 'Los Angeles Lakers', abbr: 'LAL', offRating: 114.2, defRating: 112.8, pace: 100.5, recentForm: 0.7 },
  { name: 'Boston Celtics', abbr: 'BOS', offRating: 118.4, defRating: 109.2, pace: 98.2, recentForm: 0.85 },
  { name: 'Golden State Warriors', abbr: 'GSW', offRating: 115.8, defRating: 111.4, pace: 101.2, recentForm: 0.65 },
  { name: 'Milwaukee Bucks', abbr: 'MIL', offRating: 116.9, defRating: 110.8, pace: 99.8, recentForm: 0.75 },
  { name: 'Phoenix Suns', abbr: 'PHX', offRating: 115.2, defRating: 112.1, pace: 97.4, recentForm: 0.6 },
  { name: 'Denver Nuggets', abbr: 'DEN', offRating: 117.8, defRating: 111.2, pace: 96.8, recentForm: 0.8 },
  { name: 'Miami Heat', abbr: 'MIA', offRating: 112.4, defRating: 109.8, pace: 95.2, recentForm: 0.72 },
  { name: 'Philadelphia 76ers', abbr: 'PHI', offRating: 114.8, defRating: 110.4, pace: 97.6, recentForm: 0.68 },
  { name: 'Dallas Mavericks', abbr: 'DAL', offRating: 116.2, defRating: 113.4, pace: 99.4, recentForm: 0.62 },
  { name: 'Memphis Grizzlies', abbr: 'MEM', offRating: 113.6, defRating: 111.8, pace: 102.4, recentForm: 0.58 },
  { name: 'Cleveland Cavaliers', abbr: 'CLE', offRating: 115.4, defRating: 108.6, pace: 96.2, recentForm: 0.78 },
  { name: 'New York Knicks', abbr: 'NYK', offRating: 114.6, defRating: 110.2, pace: 97.8, recentForm: 0.74 },
];

function calculatePrediction(homeTeam: Team, awayTeam: Team): Prediction {
  const homeAdvantage = 3.5;

  const avgPace = (homeTeam.pace + awayTeam.pace) / 2;
  const possessions = avgPace * 0.96;

  const homeExpectedPts = ((homeTeam.offRating + awayTeam.defRating) / 2) * (possessions / 100);
  const awayExpectedPts = ((awayTeam.offRating + homeTeam.defRating) / 2) * (possessions / 100);

  const homeScore = Math.round(homeExpectedPts + homeAdvantage * homeTeam.recentForm);
  const awayScore = Math.round(awayExpectedPts * awayTeam.recentForm);

  const totalPoints = homeScore + awayScore;
  const overUnderLine = Math.round(totalPoints / 5) * 5 + 0.5;

  const scoreDiff = homeScore - awayScore;
  const spreadLine = -Math.round(scoreDiff * 2) / 2;

  const homeWinProb = 0.5 + (scoreDiff / 40) + (homeTeam.recentForm - awayTeam.recentForm) * 0.15;
  const clampedProb = Math.min(0.92, Math.max(0.08, homeWinProb));

  const winner = homeScore > awayScore ? homeTeam.name : awayTeam.name;
  const winProbability = homeScore > awayScore ? clampedProb : 1 - clampedProb;

  const overProbability = 0.5 + ((totalPoints - overUnderLine) / 30);
  const spreadProbability = 0.5 + Math.abs(scoreDiff) / 50;

  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  if (winProbability > 0.7) confidence = 'HIGH';
  else if (winProbability < 0.55) confidence = 'LOW';

  return {
    winner,
    winProbability,
    predictedScore: { home: homeScore, away: awayScore },
    totalPoints,
    overUnderLine,
    overProbability: Math.min(0.85, Math.max(0.15, overProbability)),
    spreadLine,
    spreadCover: spreadLine < 0 ? homeTeam.abbr : awayTeam.abbr,
    spreadProbability: Math.min(0.8, Math.max(0.2, spreadProbability)),
    confidence,
  };
}

function StatBar({ label, value, max = 120, color = 'orange' }: { label: string; value: number; max?: number; color?: string }) {
  const percentage = (value / max) * 100;

  return (
    <div className="stat-bar-container">
      <div className="stat-bar-label">
        <span>{label}</span>
        <span className="stat-value">{value.toFixed(1)}</span>
      </div>
      <div className="stat-bar-track">
        <motion.div
          className={`stat-bar-fill ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function TeamSelector({
  selectedTeam,
  onSelect,
  excludeTeam
}: {
  selectedTeam: typeof NBA_TEAMS[0] | null;
  onSelect: (team: typeof NBA_TEAMS[0]) => void;
  excludeTeam: typeof NBA_TEAMS[0] | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="team-selector">
      <button
        className="selector-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedTeam ? (
          <span className="selected-team">
            <span className="team-abbr">{selectedTeam.abbr}</span>
            <span className="team-name">{selectedTeam.name}</span>
          </span>
        ) : (
          <span className="placeholder">Select Team</span>
        )}
        <span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {NBA_TEAMS.filter(t => t.abbr !== excludeTeam?.abbr).map(team => (
              <button
                key={team.abbr}
                className="dropdown-item"
                onClick={() => {
                  onSelect(team);
                  setIsOpen(false);
                }}
              >
                <span className="dropdown-abbr">{team.abbr}</span>
                {team.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PredictionCard({ prediction, homeTeam, awayTeam }: { prediction: Prediction; homeTeam: Team; awayTeam: Team }) {
  return (
    <motion.div
      className="prediction-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="prediction-header">
        <div className="broadcast-badge">
          <span className="live-dot" />
          PREDICTION LOCKED
        </div>
        <div className={`confidence-badge ${prediction.confidence.toLowerCase()}`}>
          {prediction.confidence} CONFIDENCE
        </div>
      </div>

      <div className="scoreboard">
        <div className="score-team home">
          <div className="score-abbr">{homeTeam.abbr}</div>
          <motion.div
            className="score-number"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {prediction.predictedScore.home}
          </motion.div>
        </div>
        <div className="score-divider">
          <span className="vs-text">VS</span>
          <span className="final-text">FINAL</span>
        </div>
        <div className="score-team away">
          <div className="score-abbr">{awayTeam.abbr}</div>
          <motion.div
            className="score-number"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {prediction.predictedScore.away}
          </motion.div>
        </div>
      </div>

      <div className="prediction-grid">
        <motion.div
          className="prediction-box winner"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="box-label">WINNER</div>
          <div className="box-value">{prediction.winner.split(' ').pop()}</div>
          <div className="box-prob">{(prediction.winProbability * 100).toFixed(0)}%</div>
          <div className="probability-ring">
            <svg viewBox="0 0 36 36">
              <path
                className="ring-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <motion.path
                className="ring-fill"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                initial={{ strokeDasharray: '0 100' }}
                animate={{ strokeDasharray: `${prediction.winProbability * 100} 100` }}
                transition={{ duration: 1, delay: 0.6 }}
              />
            </svg>
          </div>
        </motion.div>

        <motion.div
          className="prediction-box total"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="box-label">TOTAL POINTS</div>
          <div className="box-value">{prediction.totalPoints}</div>
          <div className="over-under">
            <span className={prediction.totalPoints > prediction.overUnderLine ? 'active' : ''}>
              OVER {prediction.overUnderLine}
            </span>
            <span className={prediction.totalPoints <= prediction.overUnderLine ? 'active' : ''}>
              UNDER {prediction.overUnderLine}
            </span>
          </div>
          <div className="box-prob">{(prediction.overProbability * 100).toFixed(0)}% Over</div>
        </motion.div>

        <motion.div
          className="prediction-box spread"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="box-label">SPREAD</div>
          <div className="box-value">
            {prediction.spreadCover} {prediction.spreadLine > 0 ? '+' : ''}{prediction.spreadLine}
          </div>
          <div className="box-prob">{(prediction.spreadProbability * 100).toFixed(0)}% Cover</div>
          <div className="spread-visual">
            <div className="spread-bar">
              <motion.div
                className="spread-indicator"
                initial={{ left: '50%' }}
                animate={{ left: `${50 + prediction.spreadLine * 2}%` }}
                transition={{ duration: 0.8, delay: 0.8 }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [homeTeam, setHomeTeam] = useState<typeof NBA_TEAMS[0] | null>(null);
  const [awayTeam, setAwayTeam] = useState<typeof NBA_TEAMS[0] | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [scanLineOffset, setScanLineOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLineOffset(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handlePredict = () => {
    if (!homeTeam || !awayTeam) return;

    setIsCalculating(true);
    setPrediction(null);

    setTimeout(() => {
      const result = calculatePrediction(
        { ...homeTeam, homeAway: 'home' },
        { ...awayTeam, homeAway: 'away' }
      );
      setPrediction(result);
      setIsCalculating(false);
    }, 1500);
  };

  return (
    <div className="app">
      <div className="scanlines" style={{ backgroundPosition: `0 ${scanLineOffset}px` }} />
      <div className="noise-overlay" />

      <header className="header">
        <motion.div
          className="logo"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="logo-icon">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" />
              <path d="M20 2 C20 2 20 38 20 38" stroke="currentColor" strokeWidth="2" />
              <path d="M2 20 C2 20 38 20 38 20" stroke="currentColor" strokeWidth="2" />
              <path d="M6 8 Q20 20 6 32" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M34 8 Q20 20 34 32" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-main">COURTSIDE</span>
            <span className="logo-sub">PREDICTOR</span>
          </div>
        </motion.div>

        <motion.div
          className="tagline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          AI-POWERED BASKETBALL ANALYTICS
        </motion.div>
      </header>

      <main className="main">
        <section className="matchup-section">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="title-accent">01</span>
            SELECT MATCHUP
          </motion.h2>

          <div className="matchup-grid">
            <motion.div
              className="team-card home"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="team-card-header">
                <span className="home-away-badge">HOME</span>
              </div>
              <TeamSelector
                selectedTeam={homeTeam}
                onSelect={setHomeTeam}
                excludeTeam={awayTeam}
              />
              {homeTeam && (
                <motion.div
                  className="team-stats"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <StatBar label="OFF RTG" value={homeTeam.offRating} color="orange" />
                  <StatBar label="DEF RTG" value={homeTeam.defRating} color="cyan" />
                  <StatBar label="PACE" value={homeTeam.pace} max={110} color="orange" />
                  <StatBar label="FORM" value={homeTeam.recentForm * 100} max={100} color="cyan" />
                </motion.div>
              )}
            </motion.div>

            <div className="vs-container">
              <motion.div
                className="vs-badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
              >
                VS
              </motion.div>
            </div>

            <motion.div
              className="team-card away"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="team-card-header">
                <span className="home-away-badge away">AWAY</span>
              </div>
              <TeamSelector
                selectedTeam={awayTeam}
                onSelect={setAwayTeam}
                excludeTeam={homeTeam}
              />
              {awayTeam && (
                <motion.div
                  className="team-stats"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <StatBar label="OFF RTG" value={awayTeam.offRating} color="orange" />
                  <StatBar label="DEF RTG" value={awayTeam.defRating} color="cyan" />
                  <StatBar label="PACE" value={awayTeam.pace} max={110} color="orange" />
                  <StatBar label="FORM" value={awayTeam.recentForm * 100} max={100} color="cyan" />
                </motion.div>
              )}
            </motion.div>
          </div>

          <motion.button
            className={`predict-button ${(!homeTeam || !awayTeam) ? 'disabled' : ''} ${isCalculating ? 'calculating' : ''}`}
            onClick={handlePredict}
            disabled={!homeTeam || !awayTeam || isCalculating}
            whileHover={{ scale: homeTeam && awayTeam ? 1.02 : 1 }}
            whileTap={{ scale: homeTeam && awayTeam ? 0.98 : 1 }}
          >
            {isCalculating ? (
              <>
                <span className="loading-dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
                ANALYZING
              </>
            ) : (
              <>
                <span className="button-icon">◉</span>
                GENERATE PREDICTION
              </>
            )}
          </motion.button>
        </section>

        <AnimatePresence>
          {prediction && (
            <motion.section
              className="prediction-section"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
            >
              <h2 className="section-title">
                <span className="title-accent">02</span>
                PREDICTION RESULTS
              </h2>

              {homeTeam && awayTeam && (
                <PredictionCard
                  prediction={prediction}
                  homeTeam={{ ...homeTeam, homeAway: 'home' }}
                  awayTeam={{ ...awayTeam, homeAway: 'away' }}
                />
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <footer className="footer">
        <span>Requested by @0xshina · Built by @clonkbot</span>
      </footer>
    </div>
  );
}
