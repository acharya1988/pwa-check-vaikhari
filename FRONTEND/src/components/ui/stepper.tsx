
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import './timeline-stepper.css';

const StepperContext = React.createContext<{
  activeStep: number;
  totalSteps: number;
}>({ activeStep: 1, totalSteps: 1 });

const StepperIndexContext = React.createContext<number>(0);

const StepperItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { 
    isCompleted?: boolean; 
    isActive?: boolean;
    isOptional?: boolean;
  }
>(({ className, children, isCompleted, isActive, isOptional, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'timeline-stepper-item',
        isActive && 'timeline-stepper-item-active',
        isCompleted && !isActive && 'timeline-stepper-item-completed',
        !isActive && !isCompleted && 'timeline-stepper-item-default',
        className
      )}
      {...props}
    >
      {isCompleted && !isActive ? <Check className="h-5 w-5" /> : children}
    </div>
  );
});
StepperItem.displayName = 'StepperItem';

const StepperLabel = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & { isActive?: boolean; }
  >(({ className, children, isActive, ...props }, ref) => {
    return (
        <span
            ref={ref}
            className={cn('timeline-stepper-label', isActive && 'timeline-stepper-label-active', className)}
            {...props}
        >
            {children}
        </span>
    );
});
StepperLabel.displayName = 'StepperLabel';

const StepperSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
        ref={ref}
        className="flex-1 h-px bg-border timeline-stepper-separator"
        {...props}
    />
  );
});
StepperSeparator.displayName = 'StepperSeparator';

interface Step {
    label: string;
}

interface LineStepperProps {
    currentStep: number;
    onStepClick: (step: number) => void;
    steps: Step[];
}

const LineStepper: React.FC<LineStepperProps> = ({ currentStep, onStepClick, steps }) => {
    const [animation, setAnimation] = React.useState<'left' | 'right' | null>(null);

    const handleStepClick = (step: number) => {
        if (step > currentStep) {
            setAnimation('right');
        } else if (step < currentStep) {
            setAnimation('left');
        }
        onStepClick(step);
    }
    
    return (
        <div className="flex justify-center items-center my-8">
            <div id="line" className={cn('line-stepper', animation)}>
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    return (
                        <div
                            key={step.label}
                            className={cn('circle', index === 0 ? 'circle-left' : 'circle-right', currentStep === stepNumber && 'active show')}
                            onClick={() => handleStepClick(stepNumber)}
                        >
                            {step.label}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

interface TimelineStepperProps extends React.HTMLAttributes<HTMLDivElement> {
    currentStep: number;
    onStepClick: (step: number) => void;
    steps: Step[];
}


const TimelineStepper = React.forwardRef<
  HTMLDivElement,
  TimelineStepperProps
>(({ className, currentStep, onStepClick, steps, ...props }, ref) => {
  const childrenArray = React.Children.toArray(props.children);
  const totalSteps = childrenArray.filter(child => React.isValidElement(child) && (child.type === StepperItem || (child.props as any).originalType === StepperItem)).length;
  const activeStep = childrenArray.findIndex(child => React.isValidElement(child) && (child.props as any).isActive) + 1;

  return (
    <StepperContext.Provider value={{ activeStep, totalSteps }}>
      <div ref={ref} className={cn('timeline-stepper', className)} {...props}>
        {React.Children.map(props.children, (child, index) => {
           if (!React.isValidElement(child)) return null;

           if (child.type === StepperItem) {
               const labelChild = childrenArray[index + 1];
               const isLabelForThisItem = React.isValidElement(labelChild) && labelChild.type === StepperLabel;
               return (
                   <StepperIndexContext.Provider value={index}>
                       <div className="timeline-stepper-item-container">
                           {child}
                           {isLabelForThisItem && labelChild}
                       </div>
                   </StepperIndexContext.Provider>
               )
           }
           if (child.type === StepperLabel) {
               const prevChild = childrenArray[index - 1];
               if(React.isValidElement(prevChild) && prevChild.type === StepperItem) {
                   return null; 
               }
           }
            return child;
        })}
      </div>
    </StepperContext.Provider>
  );
});
TimelineStepper.displayName = 'TimelineStepper';

export { TimelineStepper as Stepper, StepperItem, StepperLabel, StepperSeparator, LineStepper };
