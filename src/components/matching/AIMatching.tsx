import { Medal, Brain, Clock, Code, Crosshair, TrendUp, Users, Lightning } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { MatchResult } from '../types/matching';

export default function AIMatching() {
  const [matchingProgress, setMatchingProgress] = useState(0);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

  useEffect(() => {
    if (isMatching) {
      const interval = setInterval(() => {
        setMatchingProgress(prev => {
          if (prev >= 100) {
            setIsMatching(false);
            generateMatchResults();
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isMatching]);

  const generateMatchResults = () => {
    const results = [
      {
        id: 1,
        name: 'Alex Thompson',
        role: 'Senior React Developer',
        company: 'TechFlow Inc.',
        matchScore: 96,
        skills: ['React', 'TypeScript', 'Node.js'],
        experience: '6+ years',
        salary: '$140k',
        reason: 'Perfect skill match and cultural fit'
      },
      {
        id: 2,
        name: 'Maria Santos',
        role: 'Full Stack Engineer',
        company: 'DataVision Labs',
        matchScore: 92,
        skills: ['Vue.js', 'Python', 'AWS'],
        experience: '5+ years',
        salary: '$125k',
        reason: 'Strong technical background and location preference'
      },
      {
        id: 3,
        name: 'James Chen',
        role: 'Frontend Developer',
        company: 'Creative Solutions',
        matchScore: 88,
        skills: ['Angular', 'JavaScript', 'CSS'],
        experience: '4+ years',
        salary: '$110k',
        reason: 'Great frontend expertise and team compatibility'
      }
    ];
    setMatchResults(results);
  };

  const startMatching = () => {
    setIsMatching(true);
    setMatchingProgress(0);
    setMatchResults([]);
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'text-green-700 bg-green-100 border-green-200';
    if (score >= 80) return 'text-blue-700 bg-blue-100 border-blue-200';
    return 'text-slate-700 bg-slate-100 border-slate-200';
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            <span className="text-primary">AI-Powered</span>{' '}
            <span className="text-orange-500">Smart Matching</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Our advanced AI algorithms analyze hundreds of data points to find the perfect matches between talents and opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* AI Process Visualization */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-md border border-slate-200 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <Brain size={20} weight="regular" className="text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">AI Matching Engine</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                    <Users size={20} weight="regular" className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Profile Analysis</div>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-1">
                      <div className="w-full h-2 bg-primary rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">100%</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                    <Code size={20} weight="regular" className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Skill Matching</div>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-1">
                      <div className="w-4/5 h-2 bg-primary rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">85%</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                    <Crosshair size={20} weight="regular" className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Cultural Fit</div>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-1">
                      <div className="w-3/4 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">78%</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200">
                    <TrendUp size={20} weight="regular" className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Career Goals</div>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-1">
                      <div className="w-5/6 h-2 bg-primary rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-sm text-slate-500">92%</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Medal size={20} weight="regular" className="text-green-600" />
                  <span className="font-semibold text-green-800">Overall Match Confidence</span>
                </div>
                <div className="text-2xl font-bold text-green-700 mt-1">94%</div>
              </div>
            </div>

            {/* Matching Controls */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-slate-200 hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Start AI Matching</h3>

              {!isMatching && matchResults.length === 0 && (
                <button
                  onClick={startMatching}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <Lightning size={20} weight="regular" />
                  <span>Find My Perfect Match</span>
                </button>
              )}

              {isMatching && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="text-slate-700">AI is analyzing your profile...</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full">
                    <div
                      className="h-3 bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${matchingProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-slate-600 text-center">
                    {Math.round(matchingProgress)}% Complete
                  </div>
                </div>
              )}

              {matchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <Medal size={20} weight="regular" />
                    <span className="font-semibold">Matching Complete!</span>
                  </div>
                  <button
                    onClick={startMatching}
                    className="w-full px-6 py-3 bg-white text-primary border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-primary transition-colors font-semibold"
                  >
                    Run New Match
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Match Results */}
          <div className="space-y-6">
            {matchResults.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-slate-900">Your Top Matches</h3>
                {matchResults.map((match) => (
                  <div
                    key={match.id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-primary transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-slate-900">{match.name}</h4>
                        <p className="text-primary font-medium">{match.role}</p>
                        <p className="text-sm text-slate-600">{match.company}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getMatchColor(match.matchScore)}`}>
                        {match.matchScore}% Match
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-slate-600">Experience:</span>
                        <span className="ml-2 text-slate-900 font-medium">{match.experience}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Salary:</span>
                        <span className="ml-2 text-slate-900 font-medium">{match.salary}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {match.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-slate-50 text-slate-700 text-xs rounded-lg border border-slate-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg mb-4 border border-slate-200">
                      <div className="text-sm text-slate-600 mb-1">Why this is a great match:</div>
                      <div className="text-sm text-slate-800">{match.reason}</div>
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        View Details
                      </button>
                      <button className="px-4 py-2 bg-white text-primary border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <Clock size={20} weight="regular" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {matchResults.length === 0 && !isMatching && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
                <div className="p-4 bg-slate-50 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-slate-200">
                  <Brain size={32} weight="regular" className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Find Your Match?</h3>
                <p className="text-slate-600 mb-6">
                  Click the button on the left to start our AI matching process and discover your perfect job opportunities or talent candidates.
                </p>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-center gap-2">
                    <Crosshair size={16} weight="regular" className="text-primary" />
                    <span>Analyzes 200+ compatibility factors</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Lightning size={16} weight="regular" className="text-primary" />
                    <span>Results in under 30 seconds</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Medal size={16} weight="regular" className="text-green-600" />
                    <span>95% accuracy rate</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
