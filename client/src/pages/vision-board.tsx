import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Plus, ArrowRight, CheckCircle, Target, Heart, Star } from "lucide-react";
import { useLocation } from "wouter";
import type { VisionPlan } from "@shared/schema";
import AppLayout from "@/components/layout/AppLayout";

interface VisionCard {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'health' | 'relationships' | 'personal' | 'financial';
  position: { x: number; y: number };
}

const categoryIcons = {
  career: Target,
  health: Heart,
  relationships: Heart,
  personal: Star,
  financial: Target,
};

const categoryColors = {
  career: 'bg-blue-100 text-blue-800 border-blue-200',
  health: 'bg-green-100 text-green-800 border-green-200',
  relationships: 'bg-pink-100 text-pink-800 border-pink-200',
  personal: 'bg-purple-100 text-purple-800 border-purple-200',
  financial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

export default function VisionBoardPage() {
  const [location, navigate] = useLocation();
  const [visionCards, setVisionCards] = useState<VisionCard[]>([
    {
      id: '1',
      title: 'Dream Career',
      description: 'Leading a team that creates meaningful impact',
      category: 'career',
      position: { x: 20, y: 20 }
    },
    {
      id: '2',
      title: 'Vibrant Health',
      description: 'Feeling energetic and strong every day',
      category: 'health',
      position: { x: 300, y: 20 }
    },
    {
      id: '3',
      title: 'Deep Relationships',
      description: 'Surrounded by people who truly understand me',
      category: 'relationships',
      position: { x: 580, y: 20 }
    },
  ]);

  const [newCard, setNewCard] = useState({
    title: '',
    description: '',
    category: 'personal' as const
  });
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  const { data: visionPlan } = useQuery<VisionPlan>({
    queryKey: ["/api/vision"],
    retry: false,
  });

  const hasLifeCompass = !!(
    visionPlan?.coreValues?.length &&
    visionPlan?.threeYearVision &&
    visionPlan?.whyEngine
  );

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCard(cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedCard) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 100; // Center the card
    const y = e.clientY - rect.top - 50;

    setVisionCards(cards =>
      cards.map(card =>
        card.id === draggedCard
          ? { ...card, position: { x: Math.max(0, x), y: Math.max(0, y) } }
          : card
      )
    );
    setDraggedCard(null);
  };

  const addVisionCard = () => {
    if (newCard.title && newCard.description) {
      const newCardObj: VisionCard = {
        id: Date.now().toString(),
        ...newCard,
        position: { x: 100, y: 100 + visionCards.length * 120 }
      };
      setVisionCards([...visionCards, newCardObj]);
      setNewCard({ title: '', description: '', category: 'personal' });
      setIsAddingCard(false);
    }
  };

  const removeCard = (cardId: string) => {
    setVisionCards(cards => cards.filter(card => card.id !== cardId));
  };

  if (!hasLifeCompass) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 gradient-bg rounded-xl flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Vision Board</h1>
          <p className="text-lg text-gray-600">
            Complete your Life Compass first to unlock your vision board.
          </p>
          <Button onClick={() => navigate("/life-compass")}>
            Go to Life Compass
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Vision Board</h1>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create visual representations of your goals. Drag cards around to organize your vision.
          </p>
        </div>

        {/* Core Values Reference */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Your Core Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {visionPlan?.coreValues?.map((value: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                  {value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vision Board Canvas */}
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Vision Board</CardTitle>
            <Dialog open={isAddingCard} onOpenChange={setIsAddingCard}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vision Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Vision Card</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <Input
                      placeholder="e.g., Dream Home"
                      value={newCard.title}
                      onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                      placeholder="Describe your vision in detail..."
                      value={newCard.description}
                      onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select
                      value={newCard.category}
                      onChange={(e) => setNewCard({ ...newCard, category: e.target.value as any })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="career">Career</option>
                      <option value="health">Health</option>
                      <option value="relationships">Relationships</option>
                      <option value="personal">Personal Growth</option>
                      <option value="financial">Financial</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddingCard(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addVisionCard}>
                      Create Card
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div
              className="relative w-full h-[600px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="absolute inset-0 bg-pattern opacity-5"></div>
              
              {visionCards.map((card) => {
                const Icon = categoryIcons[card.category];
                const colorClass = categoryColors[card.category];
                
                return (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id)}
                    className={`
                      absolute w-48 p-4 bg-white rounded-lg shadow-md cursor-move transform transition-transform hover:scale-105 hover:shadow-lg border-l-4
                      ${draggedCard === card.id ? 'opacity-50' : ''}
                      ${colorClass.split(' ')[2]} // border color
                    `}
                    style={{
                      left: card.position.x,
                      top: card.position.y,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Icon className={`w-5 h-5 ${colorClass.split(' ')[1]}`} />
                      <button
                        onClick={() => removeCard(card.id)}
                        className="text-gray-400 hover:text-red-500 text-sm"
                      >
                        ×
                      </button>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                      {card.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-3">
                      {card.description}
                    </p>
                    <Badge variant="secondary" className={`mt-2 text-xs ${colorClass}`}>
                      {card.category}
                    </Badge>
                  </div>
                );
              })}
              
              {visionCards.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Drag vision cards here to create your board</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Next Step */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Vision Board Created!</h3>
                <p className="text-green-700">Ready to break down your vision into 90-day quarterly goals.</p>
              </div>
              <Button 
                onClick={() => navigate("/quarterly-quests")}
                className="ml-auto"
              >
                Next: Quarterly Quests
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}