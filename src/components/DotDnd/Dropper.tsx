import classNames from "classnames";
import { Reducer, RefObject, useCallback, useEffect, useMemo, useReducer, useRef } from "react";

export type onMoved = (element:DropElement,newX:number,newY:number) => void

export type DropElement = {
  element: JSX.Element | string | JSX.Element[];
  leftDot: number;
  topDot: number;
  widthDot: number;
  heightDot: number;
};

type DraggerProps = {
  dropElement: DropElement;
  gridSpace: number;
  parentRef: RefObject<HTMLDivElement>;
  onMoved: (newX:number,newY:number) => void
};

type DropperProps = {
  data?: DropElement[];
  editable?: boolean;
  gridSpace?: number;
  className?: string;
  style?: object;
  onMoved?: onMoved
};

type DragState = {
  state: "idle" | "clicked";
  dragStartX: number;
  dragStartY: number;
  dragX: number;
  dragY: number;
};

type DragReducerData = {
  state: "mouseDown" | "mouseMove" | "mouseUp";
  data: MouseEvent;
};



const Dragger = ({ dropElement, gridSpace, parentRef,onMoved }: DraggerProps) => {

  const calculatedX = useCallback((state:DragState) => {
    const newX = (dropElement.leftDot  + Math.floor(state.dragX / gridSpace)) * gridSpace 
    const parentWidth = parentRef.current?.clientWidth || 0;

    if (parentWidth > 0 && parentWidth < (newX + dropElement.widthDot * gridSpace)) {
      return Math.round(parentWidth/gridSpace - dropElement.widthDot) * gridSpace
    }

    if (newX < 0) {
      return 0
    }

    return newX
  },[dropElement.leftDot, dropElement.widthDot, gridSpace, parentRef]);

  const calculatedY = useCallback((state:DragState) => {
    const newY = (dropElement.topDot + Math.floor(state.dragY / gridSpace)) * gridSpace
    const parentHeight = parentRef.current?.clientHeight || 0;

    if (parentHeight > 0 && parentHeight < (newY + dropElement.heightDot * gridSpace)) {
      return Math.round(parentHeight/gridSpace - dropElement.heightDot) * gridSpace
    }

    if (newY < 0) {
      return 0
    }

    return newY 
  },[dropElement.heightDot, dropElement.topDot, gridSpace, parentRef])
  
  const dragReducer: Reducer<DragState, DragReducerData> = (
    state: DragState,
    action: DragReducerData
  ) => {
    switch (action.state) {
      case "mouseDown":
        return {
          state: "clicked",
          dragStartX: action.data.screenX,
          dragStartY: action.data.screenY,
          dragX: 0,
          dragY: 0,
        };
      case "mouseMove":
        if (state.state == "clicked")
        return {
          ...state,
          dragX: action.data.screenX - state.dragStartX,
          dragY: action.data.screenY - state.dragStartY,
        };
        break;
      case "mouseUp":
        if (state.state == "clicked") {
          return {
            state: 'idle',
            dragStartX: 0,
            dragStartY: 0,
            dragX: 0,
            dragY: 0,
          };
        }
        break;
    }
    return state;
  };

  const elementRef = useRef<HTMLDivElement>(null);
  const [dragState, dispatch] = useReducer<
    Reducer<DragState, DragReducerData>,
    DragState
  >(
    dragReducer,
    {
      state: "idle",
      dragStartX: 0,
      dragStartY: 0,
      dragX: 0,
      dragY: 0,
    },
    (x) => x
  );

  

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !parentRef || !parentRef.current) return;
    const parentElement = parentRef.current;
    const mouseEvents = [
      (e: MouseEvent) =>
        dispatch({
          state: "mouseDown",
          data: e,
        }),
      (e: MouseEvent) =>
        dispatch({
          state: "mouseMove",
          data: e,
        }),
      (e: MouseEvent) => {
        const beforeX = calculatedX(dragState)
        const beforeY = calculatedY(dragState)
        dispatch({
          state: "mouseUp",
          data: e,
        })
        onMoved(beforeX,beforeY)
      },
    ];
    element.addEventListener("mousedown", mouseEvents[0]);
    parentElement.addEventListener("mousemove", mouseEvents[1]);
    element.addEventListener("mouseup", mouseEvents[2]);
    parentElement.addEventListener("mouseup", mouseEvents[2]);
    window.addEventListener("mouseup", mouseEvents[2]);
    return () => {
      element.removeEventListener("mousedown", mouseEvents[0]);
      parentElement.removeEventListener("mousemove", mouseEvents[1]);
      element.removeEventListener("mouseup", mouseEvents[2]);
      parentElement.removeEventListener("mouseup", mouseEvents[2]);
      window.removeEventListener("mouseup", mouseEvents[2]);
    };
  }, [calculatedX, calculatedY, dragState, onMoved, parentRef]);

  return (
    <div
      ref={elementRef}
      style={{
        position: "absolute",
        overflow: "hidden",
        top: `${calculatedY(dragState)}px`,
        left: `${calculatedX(dragState)}px`,
        width: `${dropElement.widthDot * gridSpace}px`,
        height: `${dropElement.heightDot * gridSpace}px`,
        border: "1px solid black",
        userSelect: "none"
      }}
    >
      {dropElement.element}
    </div>
  );
};

export default function Dropper({
  data = [],
  className,
  style,
  editable = false,
  gridSpace = 20,
  onMoved,
}: DropperProps) {
  const dropperRef = useRef<HTMLDivElement>(null)

  const generateGridStyles = useCallback(
    () => ({
      backgroundImage: editable
        ? `radial-gradient(gray ${gridSpace/16}px, transparent 0)`
        : "",
      backgroundSize: `${gridSpace}px ${gridSpace}px`,
      backgroundPosition: `-${gridSpace * 1.5}px -${gridSpace * 1.5}px`,
    }),
    [editable, gridSpace]
  );

  return (
    <div
      ref={dropperRef}
      style={{ position: "relative",overflow: "hidden", ...generateGridStyles(), ...style }}
      className={classNames(className)}
    >
      {data.map((x, i) => (
        <Dragger onMoved={(newX:number,newY:number) => onMoved && onMoved(x,newX/gridSpace,newY/gridSpace)} key={i} parentRef={dropperRef} gridSpace={gridSpace} dropElement={x} />
      ))}
    </div>
  );
}
