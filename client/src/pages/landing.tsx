import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, Target, Calendar, Clock, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                <Compass className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">InMotion</h1>
            </div>
            <Button onClick={() => window.location.href = "/api/login"}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Turn Vision Into
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Actionable Results
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Transform your entrepreneurial dreams into systematic progress. 
            Build the business you want with proven planning frameworks and focus tools.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-3"
            onClick={() => window.location.href = "/api/login"}
          >
            Start Your Journey
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <Card className="card-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-lg flex items-center justify-center">
                <Compass className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Vision Planning</CardTitle>
              <CardDescription>
                Define your core values, 3-year vision, and purpose engine
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Quarterly Quests</CardTitle>
              <CardDescription>
                Break down big goals into 90-day actionable plans
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Weekly Planning</CardTitle>
              <CardDescription>
                Focus on 3 priorities each week with reflection
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-shadow">
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Focus Timer</CardTitle>
              <CardDescription>
                Pomodoro technique with task tracking and analytics
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Build Your Success System?</CardTitle>
              <CardDescription className="text-lg">
                Join entrepreneurs who are turning vision into $5K+ monthly revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg" 
                className="w-full text-lg"
                onClick={() => window.location.href = "/api/login"}
              >
                Start Free Today
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
