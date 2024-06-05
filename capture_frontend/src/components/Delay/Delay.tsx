import Poti from "../Controllers/Poti/Poti";

const Delay = () => {
  return (
    <div className="container grow">
      <Poti label="Time" cmd="setDelaytime" min={0} max={1} />
      <Poti label="Feedback" cmd="setDelayFeedback" min={0} max={1} />
    </div>
  );
};

export default Delay;
