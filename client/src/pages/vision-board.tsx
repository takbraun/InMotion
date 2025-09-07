import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Plus, ArrowRight, CheckCircle, Target, Heart, Star, Edit, Upload, X, Image } from "lucide-react";
import { useLocation } from "wouter";
import type { VisionPlan } from "@shared/schema";
import AppLayout from "@/components/layout/AppLayout";

interface VisionCard {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'health' | 'relationships' | 'personal' | 'financial';
  position: { x: number; y: number };
  imageUrl?: string;
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

// Function to generate better initial positions in a grid
const generateInitialPosition = (index: number): { x: number; y: number } => {
  const cols = 3;
  const cardWidth = 192; // w-48
  const cardHeight = 160;
  const spacing = 20;
  
  const col = index % cols;
  const row = Math.floor(index / cols);
  
  return {
    x: 20 + col * (cardWidth + spacing),
    y: 20 + row * (cardHeight + spacing)
  };
};

export default function VisionBoardPage() {
  const [location, navigate] = useLocation();
  const [visionCards, setVisionCards] = useState<VisionCard[]>([
    {
      id: '1',
      title: 'Dream Career',
      description: 'Leading a team that creates meaningful impact',
      category: 'career',
      position: generateInitialPosition(0),
      imageUrl: undefined
    },
    {
      id: '2',
      title: 'Vibrant Health',
      description: 'Feeling energetic and strong every day',
      category: 'health',
      position: generateInitialPosition(1),
      imageUrl: undefined
    },
    {
      id: '3',
      title: 'Deep Relationships',
      description: 'Surrounded by people who truly understand me',
      category: 'relationships',
      position: generateInitialPosition(2),
      imageUrl: undefined
    },
  ]);

  const [editingCard, setEditingCard] = useState<VisionCard | null>(null);
  const [newCard, setNewCard] = useState({
    title: '',
    description: '',
    category: 'personal' as const,
    imageUrl: ''
  });
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [touchOffset, setTouchOffset] = useState<{ x: number; y: number } | null>(null);

  const { data: visionPlan } = useQuery<VisionPlan>({
    queryKey: ["/api/vision"],
    retry: false,
  });

  const hasLifeCompass = !!(
    visionPlan?.coreValues?.length &&
    visionPlan?.threeYearVision &&
    visionPlan?.whyEngine
  );

  // Touch/Mouse event handlers for iPad support
  const handlePointerDown = (e: React.PointerEvent, cardId: string) => {
    e.preventDefault();
    setDraggedCard(cardId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setTouchOffset({ x: offsetX, y: offsetY });
    
    // Enable pointer capture for smooth dragging
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedCard || !touchOffset) return;
    e.preventDefault();

    const container = e.currentTarget.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const x = e.clientX - containerRect.left - touchOffset.x;
    const y = e.clientY - containerRect.top - touchOffset.y;

    setVisionCards(cards =>
      cards.map(card =>
        card.id === draggedCard
          ? { 
              ...card, 
              position: { 
                x: Math.max(0, Math.min(x, containerRect.width - 192)), 
                y: Math.max(0, Math.min(y, containerRect.height - 200)) 
              } 
            }
          : card
      )
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setDraggedCard(null);
    setTouchOffset(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const addVisionCard = () => {
    if (newCard.title && newCard.description) {
      const newCardObj: VisionCard = {
        id: Date.now().toString(),
        title: newCard.title,
        description: newCard.description,
        category: newCard.category,
        imageUrl: newCard.imageUrl || undefined,
        position: generateInitialPosition(visionCards.length)
      };
      setVisionCards([...visionCards, newCardObj]);
      setNewCard({ title: '', description: '', category: 'personal', imageUrl: '' });
      setIsAddingCard(false);
    }
  };

  const updateVisionCard = () => {
    if (editingCard) {
      setVisionCards(cards =>
        cards.map(card =>
          card.id === editingCard.id ? editingCard : card
        )
      );
      setEditingCard(null);
    }
  };

  const removeCard = (cardId: string) => {
    setVisionCards(cards => cards.filter(card => card.id !== cardId));
  };

  const startEditing = (card: VisionCard) => {
    setEditingCard({ ...card });
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
            Create visual representations of your goals. Touch and drag cards to organize your vision.
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
              <DialogContent className="max-w-lg">
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
                    <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={newCard.imageUrl}
                      onChange={(e) => setNewCard({ ...newCard, imageUrl: e.target.value })}
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
            <div className="relative w-full h-[700px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden touch-none">
              <div className="absolute inset-0 bg-pattern opacity-5"></div>
              
              {visionCards.map((card) => {
                const Icon = categoryIcons[card.category];
                const colorClass = categoryColors[card.category];
                
                return (
                  <div
                    key={card.id}
                    onPointerDown={(e) => handlePointerDown(e, card.id)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className={`
                      absolute w-48 bg-white rounded-lg shadow-md cursor-move transform transition-transform hover:scale-105 hover:shadow-lg border-l-4 overflow-hidden
                      ${draggedCard === card.id ? 'opacity-80 scale-105 z-50' : 'z-10'}
                      ${colorClass.split(' ')[2]} // border color
                    `}
                    style={{
                      left: card.position.x,
                      top: card.position.y,
                      touchAction: 'none',
                    }}
                  >
                    {/* Image Section */}
                    <div className="h-24 bg-gray-100 relative overflow-hidden">
                      {card.imageUrl ? (
                        <img 
                          src={card.imageUrl} 
                          alt={card.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <Image className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Action buttons overlay */}
                      <div className="absolute top-1 right-1 flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(card);
                          }}
                          className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCard(card.id);
                          }}
                          className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <Icon className={`w-4 h-4 ${colorClass.split(' ')[1]} flex-shrink-0`} />
                        <Badge variant="secondary" className={`text-xs ${colorClass} ml-2`}>
                          {card.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight">
                        {card.title}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {visionCards.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Add vision cards to create your board</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Card Dialog */}
        {editingCard && (
          <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Vision Card</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    value={editingCard.title}
                    onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={editingCard.description}
                    onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={editingCard.imageUrl || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, imageUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={editingCard.category}
                    onChange={(e) => setEditingCard({ ...editingCard, category: e.target.value as any })}
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
                  <Button variant="outline" onClick={() => setEditingCard(null)}>
                    Cancel
                  </Button>
                  <Button onClick={updateVisionCard}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

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