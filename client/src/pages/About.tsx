import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About Homesteading YouTube Videos
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Your trusted source for today's best homesteading content from YouTube
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-800">Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed text-lg">
              We curate and organize the most valuable homesteading videos from YouTube, 
              making it easy for you to find practical, educational content across 15 essential 
              self-reliance topics. Every morning, our platform automatically updates with 
              fresh content to keep you informed about the latest techniques, tips, and 
              innovations in sustainable living.
            </p>
          </CardContent>
        </Card>

        {/* What We Offer */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-800">What We Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-800">🎯 Curated Content</h3>
                <p className="text-gray-700">
                  Top 10 videos for each topic, selected based on popularity, relevance, and educational value
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-800">🔄 Daily Updates</h3>
                <p className="text-gray-700">
                  Fresh content every morning at 6 AM Eastern Time, ensuring you always see today's best videos
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-800">📱 Easy Access</h3>
                <p className="text-gray-700">
                  Simple, organized interface that works perfectly on desktop and mobile devices
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-800">🌟 Quality Focus</h3>
                <p className="text-gray-700">
                  Only authentic, high-quality educational content from established homesteading channels
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Topics Covered */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-800">15 Essential Homesteading Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-3 text-gray-700">
              <div className="space-y-2">
                <div>• Beekeeping</div>
                <div>• Organic Gardening</div>
                <div>• Composting</div>
                <div>• DIY Home Projects</div>
                <div>• Chicken Raising</div>
              </div>
              <div className="space-y-2">
                <div>• Solar Energy</div>
                <div>• Water Harvesting</div>
                <div>• Food Preservation</div>
                <div>• Herbal Medicine</div>
                <div>• Permaculture Design</div>
              </div>
              <div className="space-y-2">
                <div>• Livestock Management</div>
                <div>• Homestead Security</div>
                <div>• Alternative Energy</div>
                <div>• Emergency Preparedness</div>
                <div>• Off-Grid Water Systems</div>
                <div>• Soil Building</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-800">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                <p className="text-gray-700">
                  Our system searches YouTube daily for the most relevant and popular homesteading content
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                <p className="text-gray-700">
                  Videos are ranked by popularity, educational value, and relevance to each specific topic
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                <p className="text-gray-700">
                  The top 10 videos for each topic are automatically updated every morning at 6 AM Eastern
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                <p className="text-gray-700">
                  You browse organized, current content without searching through endless videos yourself
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acknowledgment */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-800">Acknowledgment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              This platform was developed as part of the Operation Self-Reliance Initiative, 
              with valuable contributions from the Academy of Self-Reliance. We're grateful 
              to the many homesteading content creators on YouTube who share their knowledge 
              and experience to help others achieve greater self-sufficiency.
            </p>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center text-gray-600 text-sm">
          <p>
            All video content is sourced from YouTube and remains the property of the original creators. 
            This platform serves as a curated directory to help you discover quality homesteading education.
          </p>
        </div>
      </div>
    </div>
  );
}
