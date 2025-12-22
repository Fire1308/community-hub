import { useState } from 'react';
import { Plus, Trash2, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PollCreatorProps {
  onPollChange: (poll: { question: string; options: string[]; isMultipleChoice: boolean; expiresAt?: string } | null) => void;
}

export function PollCreator({ onPollChange }: PollCreatorProps) {
  const [enabled, setEnabled] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string>('');

  const handleEnableChange = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      onPollChange(null);
    } else {
      updatePoll();
    }
  };

  const updatePoll = () => {
    if (!enabled) return;
    
    const validOptions = options.filter(o => o.trim());
    if (question.trim() && validOptions.length >= 2) {
      let expiresAt: string | undefined;
      if (expiresIn) {
        const hours = parseInt(expiresIn);
        if (!isNaN(hours)) {
          expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        }
      }
      onPollChange({
        question: question.trim(),
        options: validOptions,
        isMultipleChoice,
        expiresAt,
      });
    } else {
      onPollChange(null);
    }
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // Update poll whenever any field changes
  const handleQuestionChange = (value: string) => {
    setQuestion(value);
    setTimeout(updatePoll, 0);
  };

  const handleOptionChange = (index: number, value: string) => {
    updateOption(index, value);
    setTimeout(updatePoll, 0);
  };

  const handleMultipleChoiceChange = (checked: boolean) => {
    setIsMultipleChoice(checked);
    setTimeout(updatePoll, 0);
  };

  const handleExpiresChange = (value: string) => {
    setExpiresIn(value);
    setTimeout(updatePoll, 0);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Vote className="h-4 w-4" />
            Add Poll
          </CardTitle>
          <Switch checked={enabled} onCheckedChange={handleEnableChange} />
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Question</Label>
            <Input
              placeholder="What would you like to ask?"
              value={question}
              onChange={(e) => handleQuestionChange(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-1" /> Add Option
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="multiple-choice">Allow multiple choices</Label>
            <Switch
              id="multiple-choice"
              checked={isMultipleChoice}
              onCheckedChange={handleMultipleChoiceChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Expires in (hours, optional)</Label>
            <Input
              type="number"
              placeholder="e.g., 24"
              value={expiresIn}
              onChange={(e) => handleExpiresChange(e.target.value)}
              min={1}
              max={720}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
