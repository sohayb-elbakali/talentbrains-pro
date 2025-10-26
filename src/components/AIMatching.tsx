import { Award, Brain, Clock, Code, Target, TrendingUp, Users, Zap } from 'lucide-react';
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
    if (score >= 90) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-100 border-blue-200';
    return 'text-orange-600 bg-orange-100 border-orange-200';
  };

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            AI-Powered{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Smart Matching
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our advanced AI algorithms analyze hundreds of data points to find the perfect matches between talents and opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* AI Process Visualization */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">AI Matching Engine</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Profile Analysis</div>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                      <div className="w-full h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">100%</span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Code className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Skill Matching</div>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                      <div className="w-4/5 h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">85%</span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Cultural Fit</div>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                      <div className="w-3/4 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">78%</span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Career Goals</div>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                      <div className="w-5/6 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">92%</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">Overall Match Confidence</span>
                </div>
                <div className="text-2xl font-bold text-green-700 mt-1">94%</div>
              </div>
            </div>

            {/* Matching Controls */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Start AI Matching</h3>
              
              {!isMatching && matchResults.length === 0 && (
                <button
                  onClick={startMatching}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 font-semibold"
                >
                  <Zap className="h-5 w-5" />
                  <span>Find My Perfect Match</span>
                </button>
              )}

              {isMatching && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="text-gray-700">AI is analyzing your profile...</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div
                      className="h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${matchingProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 text-center">
                    {Math.round(matchingProgress)}% Complete
                  </div>
                </div>
              )}

              {matchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-green-600">
                    <Award className="h-5 w-5" />
                    <span className="font-semibold">Matching Complete!</span>
                  </div>
                  <button
                    onClick={startMatching}
                    className="w-full px-6 py-3 bg-white text-purple-600 border-2 border-purple-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-colors font-semibold"
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
                <h3 className="text-xl font-semibold text-gray-900">Your Top Matches</h3>
                {matchResults.map((match) => (
                  <div
                    key={match.id}
                    className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{match.name}</h4>
                        <p className="text-purple-600 font-medium">{match.role}</p>
                        <p className="text-sm text-gray-600">{match.company}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getMatchColor(match.matchScore)}`}>
                        {match.matchScore}% Match
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-600">Experience:</span>
                        <span className="ml-2 text-gray-900 font-medium">{match.experience}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Salary:</span>
                        <span className="ml-2 text-gray-900 font-medium">{match.salary}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {match.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg mb-4">
                      <div className="text-sm text-gray-600 mb-1">Why this is a great match:</div>
                      <div className="text-sm text-gray-800">{match.reason}</div>
                    </div>

                    <div className="flex space-x-3">
                      <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium">
                        View Details
                      </button>
                      <button className="px-4 py-2 bg-white text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                        <Clock className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {matchResults.length === 0 && !isMatching && (
              <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 text-center">
                <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Find Your Match?</h3>
                <p className="text-gray-600 mb-6">
                  Click the button on the left to start our AI matching process and discover your perfect job opportunities or talent candidates.
                </p>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center justify-center space-x-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span>Analyzes 200+ compatibility factors</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span>Results in under 30 seconds</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Award className="h-4 w-4 text-green-600" />
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
