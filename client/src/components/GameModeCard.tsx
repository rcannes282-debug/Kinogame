import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface GameModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  buttonText: string;
  buttonColor: "purple" | "orange" | "green" | "blue";
  onPlay: () => void;
}

export default function GameModeCard({
  title,
  description,
  icon: Icon,
  features,
  buttonText,
  buttonColor,
  onPlay,
}: GameModeCardProps) {
  const colorClasses = {
    purple: "text-game-purple border-game-purple hover:border-game-purple game-button-purple",
    orange: "text-game-orange border-game-orange hover:border-game-orange game-button-orange",
    green: "text-game-green border-game-green hover:border-game-green game-button-green",
    blue: "text-game-blue border-game-blue hover:border-game-blue game-button-blue",
  };

  return (
    <Card className="game-card p-6 hover:shadow-xl">
      <CardContent className="p-0">
        <div className="text-center mb-4">
          <Icon className={`w-12 h-12 mx-auto mb-3 ${colorClasses[buttonColor].split(' ')[0]}`} />
          <h4 className="text-xl font-semibold mb-2">{title}</h4>
          <p className="text-gray-400">{description}</p>
        </div>
        
        <div className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center text-sm text-gray-300">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                buttonColor === 'purple' ? 'bg-game-purple' :
                buttonColor === 'orange' ? 'bg-game-orange' :
                buttonColor === 'green' ? 'bg-game-green' :
                'bg-game-blue'
              }`} />
              {feature}
            </div>
          ))}
        </div>
        
        <Button 
          onClick={onPlay}
          className={`w-full py-3 rounded-xl ${colorClasses[buttonColor]} shadow-lg`}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
