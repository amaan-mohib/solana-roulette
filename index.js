const { Keypair } = require("@solana/web3.js");
const inquirer = require("inquirer");
const chalk = require("chalk");

const { getWalletBalance, transferSOL, airDropSol } = require("./solana");
const { getReturnAmount, totalAmtToBePaid, randomNumber } = require("./helper");

const publicKey = [
  188, 16, 21, 177, 168, 78, 24, 39, 56, 223, 113, 242, 162, 85, 221, 222, 145,
  206, 198, 95, 167, 94, 48, 182, 213, 75, 199, 135, 101, 10, 86, 248,
];
const secretKey = [
  215, 109, 120, 244, 57, 48, 10, 170, 116, 228, 15, 130, 109, 195, 79, 137, 7,
  245, 81, 144, 22, 190, 253, 93, 87, 4, 239, 142, 159, 215, 58, 244, 188, 16,
  21, 177, 168, 78, 24, 39, 56, 223, 113, 242, 162, 85, 221, 222, 145, 206, 198,
  95, 167, 94, 48, 182, 213, 75, 199, 135, 101, 10, 86, 248,
];
const userWallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));
// console.log(userWallet);

const TpublicKey = [
  118, 243, 184, 241, 58, 31, 15, 88, 217, 86, 184, 5, 41, 4, 248, 54, 48, 125,
  67, 10, 128, 51, 116, 207, 67, 238, 79, 86, 183, 98, 178, 9,
];
const TsecretKey = [
  5, 46, 218, 146, 174, 228, 24, 248, 37, 111, 128, 252, 198, 9, 246, 19, 106,
  185, 175, 83, 225, 23, 252, 191, 100, 147, 142, 81, 17, 7, 10, 235, 118, 243,
  184, 241, 58, 31, 15, 88, 217, 86, 184, 5, 41, 4, 248, 54, 48, 125, 67, 10,
  128, 51, 116, 207, 67, 238, 79, 86, 183, 98, 178, 9,
];

const treasuryWallet = Keypair.fromSecretKey(Uint8Array.from(TsecretKey));

const askQuestions = () => {
  const questions = [
    {
      name: "SOL",
      type: "number",
      message: "What is the amount of SOL you want to stake?",
    },
    {
      type: "rawlist",
      name: "RATIO",
      message: "What is the ratio of your staking?",
      choices: ["1:1.25", "1:1.5", "1.75", "1:2"],
      filter: function (val) {
        const stakeFactor = val.split(":")[1];
        return stakeFactor;
      },
    },
    {
      type: "number",
      name: "RANDOM",
      message: "Guess a random number from 1 to 5 (both 1, 5 included)",
      when: async (val) => {
        if (parseFloat(totalAmtToBePaid(val.SOL)) > 5) {
          console.log(
            chalk.red`You have violated the max stake limit. Stake with smaller amount.`
          );
          return false;
        } else {
          // console.log("In when")
          console.log(
            `You need to pay ${chalk.green`${totalAmtToBePaid(
              val.SOL
            )}`} to move forward`
          );
          const userBalance = await getWalletBalance(
            userWallet.publicKey.toString()
          );
          if (userBalance < totalAmtToBePaid(val.SOL)) {
            console.log(
              chalk.red`You don't have enough balance in your wallet`
            );
            return false;
          } else {
            console.log(
              chalk.green`You will get ${getReturnAmount(
                val.SOL,
                parseFloat(val.RATIO)
              )} if guessing the number correctly`
            );
            return true;
          }
        }
      },
    },
  ];
  return inquirer.prompt(questions);
};

const gameExecution = async () => {
  const generateRandomNumber = randomNumber(1, 5);
  // console.log("Generated number",generateRandomNumber);
  const answers = await askQuestions();
  if (answers.RANDOM) {
    const paymentSignature = await transferSOL(
      userWallet,
      treasuryWallet,
      totalAmtToBePaid(answers.SOL)
    );
    console.log(
      `Signature of payment for playing the game`,
      chalk.green`${paymentSignature}`
    );
    if (answers.RANDOM === generateRandomNumber) {
      //AirDrop Winning Amount
      await airDropSol(
        treasuryWallet,
        getReturnAmount(answers.SOL, parseFloat(answers.RATIO))
      );
      //guess is successfull
      const prizeSignature = await transferSOL(
        treasuryWallet,
        userWallet,
        getReturnAmount(answers.SOL, parseFloat(answers.RATIO))
      );
      console.log(chalk.green`Your guess is absolutely correct`);
      console.log(
        `Here is the price signature `,
        chalk.green`${prizeSignature}`
      );
    } else {
      //better luck next time
      console.log(chalk.yellowBright`Better luck next time`);
    }
  }
};
const init = async () => {
  await airDropSol(treasuryWallet, 2);
  setTimeout(async () => {
    console.log("wait");
    await airDropSol(userWallet, 2);
  }, 5000);
};
// init();
gameExecution();
