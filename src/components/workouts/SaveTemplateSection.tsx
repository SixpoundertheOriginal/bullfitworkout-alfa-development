
import React from "react";
import { Save, CheckCircle } from "lucide-react";

interface SaveTemplateSectionProps {
  saveAsTemplate: boolean;
  setSaveAsTemplate: (v: boolean) => void;
  templateName: string;
  setTemplateName: (v: string) => void;
  templateDescription?: string;
  setTemplateDescription?: (v: string) => void;
  workoutData: any;
}

const SaveTemplateSection = ({
  saveAsTemplate,
  setSaveAsTemplate,
  templateName,
  setTemplateName,
  templateDescription,
  setTemplateDescription,
  workoutData
}: SaveTemplateSectionProps) => (
  <div className="mb-8">
    <div 
      className="flex justify-between items-center p-4 bg-gray-900 border border-gray-800 rounded-lg mb-2"
      onClick={() => setSaveAsTemplate(!saveAsTemplate)}
    >
      <div className="flex items-center">
        <Save size={20} className="text-purple-400 mr-3" />
        <span className="font-medium">Save as Template</span>
      </div>
      <div className={`h-6 w-6 rounded-full flex items-center justify-center ${saveAsTemplate ? 'bg-purple-500 text-white' : 'bg-gray-700'}`}>
        {saveAsTemplate && <CheckCircle size={14} />}
      </div>
    </div>
    {saveAsTemplate && (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <label className="block text-sm font-medium mb-2">Template Name</label>
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder={`${workoutData?.trainingType} Template`}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        
        {setTemplateDescription && (
          <>
            <label className="block text-sm font-medium mt-4 mb-2">Description (Optional)</label>
            <textarea
              value={templateDescription || ""}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Describe what this workout template is for..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent h-20"
            />
          </>
        )}
      </div>
    )}
  </div>
);

export default SaveTemplateSection;
