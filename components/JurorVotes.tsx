export type VoteBallot = {
  juror_wallet: string;
  vote_for_renter: boolean;
};

export type VotesTally = {
  forRenter: number;
  forHost: number;
};

export type VotesResponse = {
  votes: VoteBallot[];
  tally: VotesTally;
};

/**
 * Juror-vote visibility for one milestone dispute: the running tally plus
 * one row per ballot. Votes come from the public
 * GET /disputes/:escrowId/:milestoneIndex/votes read, so anyone — not just
 * jurors — can audit how a dispute is leaning before it resolves.
 */
export function JurorVotes({ votes, tally }: { votes: VoteBallot[]; tally: VotesTally }) {
  const total = votes.length;
  return (
    <div>
      <p>
        {tally.forRenter} for renter · {tally.forHost} for host ({total} vote
        {total === 1 ? "" : "s"})
      </p>
      {total === 0 ? (
        <p>No juror votes yet.</p>
      ) : (
        <ul>
          {votes.map((v) => (
            <li key={v.juror_wallet}>
              <code>
                {v.juror_wallet.slice(0, 6)}…{v.juror_wallet.slice(-4)}
              </code>{" "}
              voted for {v.vote_for_renter ? "renter" : "host"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
