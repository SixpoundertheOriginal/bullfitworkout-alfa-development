import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfileData } from "@/pages/ProfilePage";
import { useWeightUnit } from "@/context/WeightUnitContext";

const profileFormSchema = z.object({
  full_name: z.string().nullable().optional(),
  age: z.union([z.number().positive().int().nullable(), z.string().transform(v => v === "" ? null : parseInt(v))]),
  weight: z.union([z.number().positive().nullable(), z.string().transform(v => v === "" ? null : parseFloat(v))]),
  weight_unit: z.string().default("kg"),
  height: z.union([z.number().positive().nullable(), z.string().transform(v => v === "" ? null : parseFloat(v))]),
  height_unit: z.string().default("cm"),
  fitness_goal: z.string().nullable().optional(),
  experience_level: z.string().nullable().optional(),
});

interface UserProfileFormProps {
  initialData: UserProfileData;
  onSubmit: (data: UserProfileData) => void;
}

export function UserProfileForm({ initialData, onSubmit }: UserProfileFormProps) {
  const { setWeightUnit } = useWeightUnit();
  const form = useForm<UserProfileData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: initialData.full_name || "",
      age: initialData.age,
      weight: initialData.weight,
      weight_unit: initialData.weight_unit || "kg",
      height: initialData.height,
      height_unit: initialData.height_unit || "cm",
      fitness_goal: initialData.fitness_goal || "",
      experience_level: initialData.experience_level || "",
    },
  });

  const handleSubmit = (data: UserProfileData) => {
    setWeightUnit(data.weight_unit as "kg" | "lb");
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Full Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Your full name" 
                  {...field} 
                  value={field.value || ""} 
                  className="bg-gray-800 border-gray-700 text-white" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Age</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Your age" 
                  {...field} 
                  value={field.value === null ? "" : field.value}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                  className="bg-gray-800 border-gray-700 text-white" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Weight</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1"
                    placeholder="Your weight" 
                    {...field} 
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="weight_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Unit</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    
                    const currentWeight = form.getValues("weight");
                    if (currentWeight !== null && currentWeight !== undefined) {
                      const currentUnit = form.getValues("weight_unit");
                      if (currentUnit !== value) {
                        const factor = value === "kg" ? 0.453592 : 2.20462;
                        const convertedWeight = Math.round(currentWeight * factor * 10) / 10;
                        form.setValue("weight", convertedWeight);
                      }
                    }
                  }} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Height</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1"
                    placeholder="Your height" 
                    {...field} 
                    value={field.value === null ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="height_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Unit</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="fitness_goal"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Fitness Goal</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select your fitness goal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="weight_loss">Weight Loss</SelectItem>
                  <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="endurance">Endurance</SelectItem>
                  <SelectItem value="general_fitness">General Fitness</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="experience_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Experience Level</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
        >
          Save Profile
        </Button>
      </form>
    </Form>
  );
}
