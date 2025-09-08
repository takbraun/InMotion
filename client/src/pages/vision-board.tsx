import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Plus, ArrowRight, CheckCircle, Target, Heart, Star, Edit, X, Image } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { VisionPlan, VisionCard as DbVisionCard } from "@shared/schema";
import AppLayout from "@/components/layout/AppLayout";
import { ImageUpload } from "@/components/ui/image-upload";

// Extend database VisionCard type with position object for UI
interface VisionCard extends Omit<DbVisionCard, 'positionX' | 'positionY' | 'userId' | 'createdAt' | 'updatedAt'> {
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Load vision plan
  const { data: visionPlan } = useQuery<VisionPlan>({
    queryKey: ["/api/vision"],
    retry: false,
  });

  // Load vision cards from database
  const { data: dbVisionCards = [] } = useQuery<DbVisionCard[]>({
    queryKey: ["/api/vision-cards"],
    retry: false,
  });

  // Convert DB vision cards to UI format
  const visionCards: VisionCard[] = dbVisionCards.map(card => ({
    ...card,
    position: { x: card.positionX, y: card.positionY }
  }));

  // Mutations for vision cards
  const createCardMutation = useMutation({
    mutationFn: async (cardData: any) => {
      const response = await fetch('/api/vision-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(cardData),
      });
      if (!response.ok) throw new Error('Failed to create card');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vision-cards"] });
      toast({ title: "Vision card created!", description: "Your vision has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create vision card", variant: "destructive" });
    }
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/vision-cards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update card');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vision-cards"] });
      toast({ title: "Vision card updated!", description: "Your changes have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update vision card", variant: "destructive" });
    }
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/vision-cards/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete card');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vision-cards"] });
      toast({ title: "Vision card deleted", description: "The card has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete vision card", variant: "destructive" });
    }
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

    // Update position optimistically for immediate feedback
    const newPosition = { 
      x: Math.max(0, Math.min(x, containerRect.width - 192)), 
      y: Math.max(0, Math.min(y, containerRect.height - 200)) 
    };

    // Update local cache for immediate feedback
    queryClient.setQueryData(["/api/vision-cards"], (oldData: DbVisionCard[] | undefined) => {
      if (!oldData) return oldData;
      return oldData.map(card => 
        card.id === draggedCard 
          ? { ...card, positionX: newPosition.x, positionY: newPosition.y }
          : card
      );
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    
    // Save position to database when drag ends
    if (draggedCard) {
      const cardToUpdate = visionCards.find(c => c.id === draggedCard);
      if (cardToUpdate) {
        updateCardMutation.mutate({
          id: cardToUpdate.id,
          data: {
            title: cardToUpdate.title,
            description: cardToUpdate.description,
            category: cardToUpdate.category,
            imageUrl: cardToUpdate.imageUrl || null,
            positionX: cardToUpdate.position.x,
            positionY: cardToUpdate.position.y,
          }
        });
      }
    }
    
    setDraggedCard(null);
    setTouchOffset(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const addVisionCard = () => {
    if (newCard.title && newCard.description) {
      const initialPosition = generateInitialPosition(visionCards.length);
      createCardMutation.mutate({
        title: newCard.title,
        description: newCard.description,
        category: newCard.category,
        imageUrl: newCard.imageUrl || null,
        positionX: initialPosition.x,
        positionY: initialPosition.y,
      });
      setNewCard({ title: '', description: '', category: 'personal', imageUrl: '' });
      setIsAddingCard(false);
    }
  };

  const removeCard = (cardId: string) => {
    deleteCardMutation.mutate(cardId);
  };

  const startEditing = (card: VisionCard) => {
    setEditingCard(card);
  };

  const updateVisionCard = () => {
    if (editingCard && editingCard.title && editingCard.description) {
      updateCardMutation.mutate({
        id: editingCard.id,
        data: {
          title: editingCard.title,
          description: editingCard.description,
          category: editingCard.category,
          imageUrl: editingCard.imageUrl || null,
          positionX: editingCard.position.x,
          positionY: editingCard.position.y,
        }
      });
      setEditingCard(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vision Board</h1>
            <p className="text-gray-600">Transform your dreams into visual inspiration</p>
          </div>
        </div>

        {/* Life Compass reminder */}
        {!hasLifeCompass && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Complete your Life Compass first</p>
                  <p className="text-xs text-amber-600">Your vision board will be more powerful when guided by your core values and long-term vision.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setLocation('/life-compass')}>
                  Complete Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Core Values Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span>Your Core Values</span>
            </CardTitle>
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
              <DialogContent className="max-w-lg" aria-describedby="create-dialog-description">
                <DialogHeader>
                  <DialogTitle>Create Vision Card</DialogTitle>
                </DialogHeader>
                <p id="create-dialog-description" className="sr-only">Create a new vision card with title, description, image, and category.</p>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="create-title" className="block text-sm font-medium mb-2">Title</label>
                    <Input
                      id="create-title"
                      placeholder="e.g., Dream Home"
                      value={newCard.title}
                      onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="create-description" className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                      id="create-description"
                      placeholder="Describe your vision in detail..."
                      value={newCard.description}
                      onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <ImageUpload
                    onImageUploaded={(imageUrl) => setNewCard({ ...newCard, imageUrl })}
                    currentImageUrl={newCard.imageUrl}
                    onImageRemoved={() => setNewCard({ ...newCard, imageUrl: '' })}
                  />
                  <div>
                    <label htmlFor="create-category" className="block text-sm font-medium mb-2">Category</label>
                    <select
                      id="create-category"
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
                const Icon = categoryIcons[card.category as keyof typeof categoryIcons];
                const colorClass = categoryColors[card.category as keyof typeof categoryColors];
                
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
                          onPointerDown={(e) => e.stopPropagation()}
                          onPointerUp={(e) => {
                            e.stopPropagation();
                            startEditing(card);
                          }}
                          className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 z-20"
                          style={{ touchAction: 'auto' }}
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onPointerDown={(e) => e.stopPropagation()}
                          onPointerUp={(e) => {
                            e.stopPropagation();
                            removeCard(card.id);
                          }}
                          className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 z-20"
                          style={{ touchAction: 'auto' }}
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
          <Dialog open={!!editingCard} onOpenChange={() => {}}>
            <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()} aria-describedby="edit-dialog-description">
              <DialogHeader>
                <DialogTitle>Edit Vision Card</DialogTitle>
              </DialogHeader>
              <p id="edit-dialog-description" className="sr-only">Edit your vision card details including title, description, image, and category.</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    id="edit-title"
                    value={editingCard.title}
                    onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    id="edit-description"
                    value={editingCard.description}
                    onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <ImageUpload
                  onImageUploaded={(imageUrl) => setEditingCard({ ...editingCard, imageUrl })}
                  currentImageUrl={editingCard.imageUrl || undefined}
                  onImageRemoved={() => setEditingCard({ ...editingCard, imageUrl: null })}
                />
                <div>
                  <label htmlFor="edit-category" className="block text-sm font-medium mb-2">Category</label>
                  <select
                    id="edit-category"
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
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Ready for the next step?</h3>
                <p className="text-sm text-green-600">
                  Turn your vision into action with quarterly quests
                </p>
              </div>
              <Button onClick={() => setLocation('/quarterly-quests')} className="bg-green-600 hover:bg-green-700">
                Set Quarterly Goals
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}