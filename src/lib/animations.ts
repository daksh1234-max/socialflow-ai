import { FadeIn, FadeOut, SlideInDown, SlideOutDown, ZoomIn, ZoomOut } from 'react-native-reanimated';

export const Animations = {
  entrance: FadeIn.duration(400),
  exit: FadeOut.duration(200),
  slideUp: SlideInDown.springify().damping(15),
  slideDown: SlideOutDown.duration(200),
  scaleIn: ZoomIn.duration(300),
  scaleOut: ZoomOut.duration(200),
};
